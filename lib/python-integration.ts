import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"
import fsSync from "fs"

export interface ExtractedInvoiceData {
  supplier: {
    name?: string
    address?: string
    email?: string
    phone?: string
    tax_id?: string
    iban?: string
    bic?: string
    rib?: string
  }
  invoice: {
    number?: string
    date?: string
    due_date?: string
    payment_terms?: string
    currency?: string
    total_amount?: number
    tax_amount?: number
    subtotal?: number
  }
  items: Array<{
    description?: string
    quantity?: number
    unit_price?: number
    total_price?: number
    tax_rate?: number
  }>
  payment_info: {
    iban?: string
    bic?: string
    reference?: string
  }
}

function fileExists(p: string) {
  try {
    fsSync.accessSync(p)
    return true
  } catch {
    return false
  }
}

/**
 * Resolve a Python interpreter that has your deps installed.
 * Priority:
 *   1) process.env.PYTHON_BIN
 *   2) .venv/bin/python (Unix) or .venv/Scripts/python.exe (Windows)
 *   3) "python3" (fallback)
 */
function getPythonBin(): string {
  if (process.env.PYTHON_BIN && process.env.PYTHON_BIN.trim()) {
    return process.env.PYTHON_BIN.trim()
  }
  const root = process.cwd()
  const unix = path.join(root, ".venv", "bin", "python")
  const win = path.join(root, ".venv", "Scripts", "python.exe")
  if (fileExists(unix)) return unix
  if (fileExists(win)) return win
  return "python3"
}

/**
 * Build the inline Python code. We pass paths and keys via env (no string escaping issues).
 * It imports your module from scripts/, loads the API key (GEMINI or GOOGLE),
 * then runs the extractor and prints JSON to stdout.
 */
function inlinePythonCode(): string {
  return `
import os, sys, json

# Ensure scripts/ is importable
py_script_dir = os.environ.get("PY_SCRIPT_DIR")
if not py_script_dir:
    print(json.dumps({"error": "PY_SCRIPT_DIR not set"})); sys.exit(1)
if py_script_dir not in sys.path:
    sys.path.append(py_script_dir)

# Import your extractor module/class
try:
    from invoice_extractor import InvoiceExtractor
except Exception as e:
    print(json.dumps({"error": f"Failed to import invoice_extractor: {e}"})); sys.exit(1)

# Get API key (support both names)
api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print(json.dumps({"error": "GEMINI_API_KEY/GOOGLE_API_KEY not set"})); sys.exit(1)

# Get file path to process
file_path = os.environ.get("PY_FILE_PATH")
if not file_path or not os.path.exists(file_path):
    print(json.dumps({"error": f"Invalid file path: {file_path}"})); sys.exit(1)

# Run
try:
    extractor = InvoiceExtractor(api_key)
    result = extractor.process_file(file_path)
    # Ensure it's serializable
    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
  `.trim()
}

export class PythonInvoiceExtractor {
  private pythonScriptDir: string

  constructor() {
    // Directory where invoice_extractor.py lives
    this.pythonScriptDir = path.join(process.cwd(), "scripts")
  }

  async extractFromFile(filePath: string): Promise<ExtractedInvoiceData> {
    return new Promise((resolve, reject) => {
      const python = getPythonBin()

      // Important: pass paths/keys via env, not inside the code
      const env = {
        ...process.env,
        PY_SCRIPT_DIR: this.pythonScriptDir,
        PY_FILE_PATH: filePath,
        // Allow both names; keep existing env values
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "",
      }

      const child = spawn(python, ["-c", inlinePythonCode()], {
        cwd: process.cwd(),
        env,
        stdio: ["ignore", "pipe", "pipe"],
      })

      let stdout = ""
      let stderr = ""

      child.stdout.on("data", (d) => (stdout += d.toString()))
      child.stderr.on("data", (d) => (stderr += d.toString()))

      child.on("close", (code) => {
        if (code !== 0) {
          // Bubble up useful error context
          return reject(
            new Error(
              `Python process failed (code ${code}).\nSTDERR:\n${stderr || "(empty)"}\nSTDOUT:\n${stdout || "(empty)"}`
            )
          )
        }
        try {
          const parsed = JSON.parse(stdout.trim())
          if (parsed && parsed.error) {
            return reject(new Error(String(parsed.error)))
          }
          resolve(parsed as ExtractedInvoiceData)
        } catch (e) {
          reject(new Error(`Failed to parse Python output as JSON. Raw:\n${stdout}\nError: ${(e as Error).message}`))
        }
      })
    })
  }

  async saveUploadedFile(file: File, uploadDir: string): Promise<string> {
    await fs.mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const originalName = file.name
    const filename = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = path.join(uploadDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return filePath
  }
}
