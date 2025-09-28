
"use client"

import { useEffect, useState } from "react"

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        // load saved theme or system preference
        const saved = localStorage.getItem("theme")
        const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const shouldDark = saved ? saved === "dark" : preferDark
        document.documentElement.classList.toggle("dark", shouldDark)
        setIsDark(shouldDark)
    }, [])

    const toggle = () => {
        const next = !isDark
        document.documentElement.classList.toggle("dark", next)
        localStorage.setItem("theme", next ? "dark" : "light")
        setIsDark(next)
    }

    return (
        <button onClick={toggle} className="rounded-xl px-3 py-1 text-sm border">
            {isDark ? "🌙 Dark" : "☀️ Light"}
        </button>
    )
}
