export interface Supplier {
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
    tax_id?: string
    iban?: string
    bic?: string
    rib?: string
    created_at: string
    updated_at: string
}

export interface Currency {
    id: string
    code: string
    name: string
    symbol?: string
    is_base: boolean
    created_at: string
}

export interface ExchangeRate {
    id: string
    from_currency_id: string
    to_currency_id: string
    rate: number
    created_at: string
    updated_at: string
}

export interface Invoice {
    id: string
    invoice_number?: string
    supplier_id: string
    issue_date?: string
    due_date?: string
    total_amount: number
    currency_id: string
    total_amount_tnd?: number
    exchange_rate?: number
    status: "pending" | "paid" // keep as-is if this is your current union
    created_at?: string
    updated_at?: string
}
