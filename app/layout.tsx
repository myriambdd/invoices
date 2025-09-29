import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

// Load design tokens first, then Tailwind layers
import "../styles/globals.css"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Invoice Management System",
  description: "AI-powered invoice extraction and management platform",
  generator: "Next.js",
}

// Prevent theme flash: run before hydration to set .dark based on saved/system
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved ? saved === 'dark' : preferDark;
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
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}