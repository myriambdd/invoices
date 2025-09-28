# -*- coding: utf-8 -*-
"""
invoice_extractor.py — Gemini extraction with robust JSON + due date + IBAN/BIC + RIB (TN)

Usage:
    pip install google-generativeai python-dateutil pillow python-dotenv
    # Put GOOGLE_API_KEY in a .env next to this file or export it in your shell
    python3 invoice_extractor.py path/to/invoice.(pdf|jpg|jpeg|png|webp)

Returned JSON keys:
  invoice_number, invoice_date (YYYY-MM-DD), supplier_name, supplier_tax_id,
  currency, amount_ht, amount_tva, amount_ttc,
  payment_terms, payment_method (cash/cheque/virement/carte/traite/mandat/autre),
  iban, bic, rib (TN if possible),
  due_date_exists, due_date,
  buyer_name, buyer_tax_id,
  lines[{description, qty, unit, unit_price, total}], notes,
  source_path, model
"""

import os
import re
import io
import sys
import json
import fitz  # PyMuPDF (only needed if you choose to rasterize PDFs; we send PDFs directly by default)
from typing import Any, Dict, List, Optional
from pathlib import Path
from datetime import datetime, date, timedelta

from PIL import Image
from dotenv import load_dotenv
from dateutil import parser as dateparser
from dateutil.relativedelta import relativedelta

import google.generativeai as genai

# -----------------------------------------------------------------------------
# ENV & Config
# -----------------------------------------------------------------------------
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY (or GEMINI_API_KEY). Put it in .env or export it.")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
genai.configure(api_key=API_KEY)

DEFAULT_DUE_DAYS: Optional[int] = None  # fallback only if invoice_date exists and no explicit terms/due date
try:
    dd = os.getenv("DEFAULT_DUE_DAYS")
    if dd:
        DEFAULT_DUE_DAYS = int(dd)
except Exception:
    DEFAULT_DUE_DAYS = None

# -----------------------------------------------------------------------------
# Helpers: numbers, dates
# -----------------------------------------------------------------------------
def _to_float(x) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if not s:
        return None
    s = s.replace(" ", "").replace("\u00A0", "").replace(",", ".")
    try:
        return float(re.sub(r"[^0-9.\-]", "", s))
    except Exception:
        return None

def _try_parse_date_iso(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        dt = dateparser.parse(s, dayfirst=True, fuzzy=True)
        if dt:
            return dt.date().isoformat()
    except Exception:
        pass
    return None

def _iso_to_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return None

def _end_of_month(d: date) -> date:
    return (d.replace(day=1) + relativedelta(months=1) - timedelta(days=1))

# -----------------------------------------------------------------------------
# IBAN / BIC validation
# -----------------------------------------------------------------------------
IBAN_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$")
BIC_RE  = re.compile(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$")

def _clean_iban(raw: Optional[str]) -> Optional[str]:
    if not isinstance(raw, str):
        return None
    s = re.sub(r"[^A-Za-z0-9]", "", raw).upper()
    if not s or not IBAN_RE.match(s):
        return None
    return " ".join(s[i:i+4] for i in range(0, len(s), 4))

def _clean_bic(raw: Optional[str]) -> Optional[str]:
    if not isinstance(raw, str):
        return None
    s = re.sub(r"[^A-Za-z0-9]", "", raw).upper()
    if not s or not BIC_RE.match(s):
        return None
    return s

# -----------------------------------------------------------------------------
# RIB (Tunisia) handling
# -----------------------------------------------------------------------------
RIB_TN_DIGITS_RE = re.compile(r"\b(\d[\s\-.]*){20}\b")

def _just_digits(s: str) -> str:
    return re.sub(r"\D", "", s)

def _format_rib_tn(d20: str) -> str:
    return f"{d20[0:2]} {d20[2:5]} {d20[5:18]} {d20[18:20]}"

def _is_valid_rib_tn_digits(d: str) -> bool:
    return bool(d) and len(d) == 20 and d.isdigit()

def _clean_rib_tn(raw: Optional[str]) -> Optional[str]:
    if not isinstance(raw, str) or not raw.strip():
        return None
    d = _just_digits(raw)
    if _is_valid_rib_tn_digits(d):
        return _format_rib_tn(d)
    return None

def _rib_from_iban_tn(iban_clean: Optional[str]) -> Optional[str]:
    if not isinstance(iban_clean, str):
        return None
    compact = re.sub(r"\s+", "", iban_clean).upper()
    if not IBAN_RE.match(compact) or not compact.startswith("TN"):
        return None
    bban = compact[4:]  # TN + 2 digits + 20-digit BBAN
    if _is_valid_rib_tn_digits(bban):
        return _format_rib_tn(bban)
    return None

def _scan_rib_in_text(text: Optional[str]) -> Optional[str]:
    if not isinstance(text, str) or not text.strip():
        return None
    label_pat = re.compile(r"(?:\bR\.?I\.?B\.?\b|\bRIB\b|\bRIB\s+bancaire\b)\s*[:\-]?\s*((\d[\s\-.]*){20})", re.I)
    m = label_pat.search(text)
    if m:
        d = _just_digits(m.group(1))
        if _is_valid_rib_tn_digits(d):
            return _format_rib_tn(d)
    for m in RIB_TN_DIGITS_RE.finditer(text):
        d = _just_digits(m.group(0))
        if _is_valid_rib_tn_digits(d):
            return _format_rib_tn(d)
    return None

# -----------------------------------------------------------------------------
# Payment method normalization
# -----------------------------------------------------------------------------
def _normalize_payment_method(raw: Optional[str]) -> Optional[str]:
    if not isinstance(raw, str) or not raw.strip():
        return None
    t = raw.lower()
    if re.search(r"\b(cash|especes|espèces|liquide)\b", t): return "cash"
    if re.search(r"\b(cheque|chèque|check)\b", t):        return "cheque"
    if re.search(r"\b(virement|transfer|transfert|wire|sepa)\b", t): return "virement"
    if re.search(r"\b(carte|cb|visa|mastercard|credit\s*card|debit\s*card)\b", t): return "carte"
    if re.search(r"\b(traite|lettre\s*de\s*change)\b", t): return "traite"
    if re.search(r"\b(mandat|money\s*order)\b", t):        return "mandat"
    if re.search(r"\b(paypal|wallet|crypto|bitcoin|stripe)\b", t):   return "autre"
    return None

# -----------------------------------------------------------------------------
# Due date computation from terms
# -----------------------------------------------------------------------------
TERMS_PATTERNS = [
    re.compile(r"\bnet[\s\-]*?(?P<days>\d{1,3})\b", re.I),             # Net 30
    re.compile(r"\b(?P<days>\d{1,3})\s*(jours?|j|days?|d)\b", re.I),   # 30 jours
    re.compile(r"\b(?P<w>\d{1,2})\s*(semaines?|weeks?|w)\b", re.I),    # 2 semaines
]
EOM_PATTERNS = [
    re.compile(r"\b(fin\s*de\s*mois|EOM)\b", re.I),
    re.compile(r"\b(?P<days>\d{1,3})\s*(j|jours)\s*fin\s*de\s*mois\b", re.I),
]
INSTANT_PATTERNS = [
    re.compile(r"\b(à\s*réception|upon\s*receipt)\b", re.I),
    re.compile(r"\b(comptant|immédiat|immediate)\b", re.I),
]

def compute_due_date(invoice_date_iso: Optional[str], payment_terms: Optional[str]) -> Optional[str]:
    inv = _iso_to_date(invoice_date_iso)
    if not inv or not payment_terms:
        return None
    t = payment_terms.lower()

    for pat in INSTANT_PATTERNS:
        if pat.search(t):
            return inv.isoformat()

    for pat in EOM_PATTERNS:
        m = pat.search(t)
        if m:
            eom = _end_of_month(inv)
            if m.groupdict().get("days"):
                try:
                    add = int(m.group("days"))
                    return (eom + timedelta(days=add)).isoformat()
                except Exception:
                    return None
            return eom.isoformat()

    for pat in TERMS_PATTERNS:
        m = pat.search(t)
        if m:
            if m.groupdict().get("days"):
                try:
                    dd = int(m.group("days"))
                    return (inv + timedelta(days=dd)).isoformat()
                except Exception:
                    return None
            if m.groupdict().get("w"):
                try:
                    ww = int(m.group("w"))
                    return (inv + timedelta(weeks=ww)).isoformat()
                except Exception:
                    return None
    return None

# -----------------------------------------------------------------------------
# Robust JSON extraction from model text
# -----------------------------------------------------------------------------
def _strip_code_fences(s: str) -> str:
    txt = s.strip()
    if txt.startswith("```"):
        first_nl = txt.find("\n")
        if first_nl != -1:
            txt = txt[first_nl+1:].strip()
        if txt.endswith("```"):
            txt = txt[:-3].strip()
    return txt

def _extract_json_block(s: str) -> Dict[str, Any]:
    txt = _strip_code_fences(s)
    try:
        return json.loads(txt)
    except Exception:
        pass
    l = txt.find("{")
    r = txt.rfind("}")
    if l != -1 and r != -1 and r > l:
        candidate = txt[l : r + 1]
        return json.loads(candidate)
    raise ValueError("Model did not return valid JSON")

# -----------------------------------------------------------------------------
# Core class (keeps your original API but with enhanced behavior)
# -----------------------------------------------------------------------------
class InvoiceExtractor:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        """Initialize the invoice extractor with Gemini API key."""
        genai.configure(api_key=api_key or API_KEY)
        self.model_name = model_name or MODEL_NAME
        # Force JSON output
        self.model = genai.GenerativeModel(
            self.model_name,
            generation_config={"response_mime_type": "application/json"}
        )

    # If you still want rasterization (not needed now), keep this utility:
    def _pdf_to_first_image(self, pdf_path: str) -> Image.Image:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            doc.close()
            raise ValueError("Empty PDF")
        page = doc.load_page(0)
        pix = page.get_pixmap()
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        doc.close()
        return img

    def process_file(self, file_path: str) -> Dict[str, Any]:
        """Process a PDF or image file and return the normalized extracted data."""
        ext = Path(file_path).suffix.lower()
        content: List[Any] = [self._prompt_text()]  # prompt first

        if ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]:
            try:
                img = Image.open(file_path)
            except Exception as e:
                raise Exception(f"Error opening image: {e}")
            content.append(img)
        elif ext == ".pdf":
            # Send PDF directly to Gemini
            try:
                with open(file_path, "rb") as f:
                    pdf_bytes = f.read()
            except Exception as e:
                raise Exception(f"Error reading PDF: {e}")
            content.append({"mime_type": "application/pdf", "data": pdf_bytes})
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        try:
            resp = self.model.generate_content(content)
            data = _extract_json_block(resp.text or "")

            # --- Normalizations like the second script ---
            data["amount_ht"]  = _to_float(data.get("amount_ht"))
            data["amount_tva"] = _to_float(data.get("amount_tva"))
            data["amount_ttc"] = _to_float(data.get("amount_ttc"))

            data["invoice_date"] = _try_parse_date_iso(data.get("invoice_date"))
            data["due_date"]     = _try_parse_date_iso(data.get("due_date"))

            if "due_date_exists" not in data or data["due_date_exists"] is None:
                data["due_date_exists"] = bool(data.get("due_date"))

            cur = data.get("currency")
            data["currency"] = (cur.strip().upper() if isinstance(cur, str) and cur.strip() else None)

            clean_lines = []
            for li in (data.get("lines") or []):
                if isinstance(li, dict):
                    clean_lines.append({
                        "description": li.get("description") or None,
                        "qty": _to_float(li.get("qty")),
                        "unit": li.get("unit") or None,
                        "unit_price": _to_float(li.get("unit_price")),
                        "total": _to_float(li.get("total")),
                    })
            data["lines"] = clean_lines

            pt = data.get("payment_terms")
            if not isinstance(pt, str) or not pt.strip():
                pt = None
            data["payment_terms"] = pt

            data["payment_method"] = _normalize_payment_method(data.get("payment_method"))

            data["iban"] = _clean_iban(data.get("iban"))
            data["bic"]  = _clean_bic(data.get("bic"))

            # RIB (TN): clean, derive from IBAN if Tunisian, else scan text fields
            rib_clean = _clean_rib_tn(data.get("rib")) if isinstance(data.get("rib"), str) else None
            if not rib_clean and data.get("iban"):
                rib_clean = _rib_from_iban_tn(data["iban"])
            if not rib_clean:
                # scan likely text fields
                for k in ("notes", "payment_terms", "supplier_name", "buyer_name"):
                    v = data.get(k)
                    if isinstance(v, str):
                        rib_clean = _scan_rib_in_text(v)
                        if rib_clean:
                            break
            data["rib"] = rib_clean

            # Compute due date if still missing
            if not data.get("due_date"):
                computed = compute_due_date(data.get("invoice_date"), data.get("payment_terms"))
                if computed:
                    data["due_date"] = computed
                    data["due_date_exists"] = True
                else:
                    inv = _iso_to_date(data.get("invoice_date"))
                    if inv and isinstance(DEFAULT_DUE_DAYS, int) and DEFAULT_DUE_DAYS > 0:
                        data["due_date"] = (inv + timedelta(days=DEFAULT_DUE_DAYS)).isoformat()
                        data["due_date_exists"] = True
                    else:
                        data["due_date"] = None
                        data["due_date_exists"] = bool(data.get("due_date_exists", False))

            # Ensure optional keys exist
            for k in ["invoice_number","supplier_name","supplier_tax_id","buyer_name","buyer_tax_id","notes"]:
                if k not in data:
                    data[k] = None

            data["source_path"] = os.path.abspath(file_path)
            data["model"] = self.model_name
            return data

        except Exception as e:
            raise Exception(f"Error during extraction: {e}")

    # Prompt matches the second script’s contract and asks for JSON only
    def _prompt_text(self) -> str:
        return """
Return ONLY a JSON object (no prose, no code fences). From the provided document (image or PDF),
extract these keys; if unknown, set null (not empty strings):

- invoice_number
- invoice_date (YYYY-MM-DD)
- supplier_name
- supplier_tax_id
- currency (e.g., TND, EUR)
- amount_ht
- amount_tva
- amount_ttc
- payment_terms
- payment_method
- iban
- bic
- rib                    # Tunisian bank RIB if printed. If not Tunisian, set null.
- due_date               # explicit printed due date only
- due_date_exists        # true if explicit printed due date is present
- buyer_name
- buyer_tax_id
- lines: array of {description, qty, unit, unit_price, total}
- notes
"""

# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 invoice_extractor.py <file.(pdf|jpg|jpeg|png|webp)>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    try:
        extractor = InvoiceExtractor()
        result = extractor.process_file(path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"[Erreur] {e}", file=sys.stderr)
        sys.exit(1)
