// src/lib/query.ts
// Tagged template that turns `sql` into parameterized text + values
export function sql(
    strings: TemplateStringsArray,
    ...values: any[]
): { text: string; params: any[] } {
    const params: any[] = []
    const text = strings
        .map((str, i) => {
            if (i === 0) return str
            params.push(values[i - 1])
            return `$${params.length}${str}`
        })
        .join("")
    return { text, params }
}
