// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CurrencyConverter } from "@/lib/currency"
import { useEffect } from "react"

// 1) Load design tokens first (variables), then Tailwind layers
import "../styles/globals.css"   // defines :root and .dark CSS variables
import "./globals.css"           // tailwind layers + your @apply rules

// (optional) Theme toggle button component from previous message
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Invoice Management System",
  description: "AI-powered invoice extraction and management platform",
  generator: "v0.app",
}

// Prevent theme flash: run before hydration to set .dark based on saved/system
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved ? saved === 'dark' : prefersDark;
    var c = document.documentElement.classList;
    if (dark) c.add('dark'); else c.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize currency converter on app start
  useEffect(() => {
    CurrencyConverter.initialize()
  }, [])

  return (
    // Don't hardcode "dark" here—script above decides it before hydration
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Run theme init early to avoid light/dark flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {/* Optional floating toggle; remove if not needed */}
        <div className="fixed right-3 top-3 z-50">
          <ThemeToggle />
        </div>

        {children}
      </body>
    </html>
  )
}
