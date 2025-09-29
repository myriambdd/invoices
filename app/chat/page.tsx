"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Bot, User, Calendar, DollarSign, Building2, Clock } from "lucide-react"
import { CurrencyDisplay } from "@/components/currency-display"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  data?: any
}

interface QuickQuery {
  label: string
  query: string
  icon: React.ReactNode
}

const quickQueries: QuickQuery[] = [
  {
    label: "Due Today",
    query: "What invoices are due today?",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    label: "This Week",
    query: "Show me all payments due this week",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    label: "This Month",
    query: "What's the total amount due this month?",
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    label: "Top Suppliers",
    query: "Who are my top 5 suppliers by amount?",
    icon: <Building2 className="h-4 w-4" />,
  },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your invoice assistant. Ask me about your invoices, payments, suppliers, or any financial data. Try asking 'What invoices are due today?' or 'Show me my top suppliers'.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        data: data.data,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuery = (query: string) => {
    handleSendMessage(query)
  }

  const renderMessageContent = (message: Message) => {
    if (message.data) {
      return (
        <div className="space-y-3">
          <p>{message.content}</p>
          {message.data.invoices && (
            <div className="space-y-2">
              {message.data.invoices.map((invoice: any) => (
                <Card key={invoice.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invoice.supplier_name}</p>
                      <p className="text-sm text-muted-foreground">Invoice #{invoice.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay amount={invoice.total_amount} currency={invoice.currency} />
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "overdue"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {message.data.suppliers && (
            <div className="space-y-2">
              {message.data.suppliers.map((supplier: any) => (
                <Card key={supplier.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">{supplier.invoice_count} invoices</p>
                    </div>
                    <CurrencyDisplay amount={supplier.total_amount} currency="TND" />
                  </div>
                </Card>
              ))}
            </div>
          )}
          {message.data.summary && (
            <Card className="p-4 bg-primary/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(message.data.summary).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-2xl font-bold">{value as string}</p>
                    <p className="text-sm text-muted-foreground capitalize">{key.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )
    }

    return <p>{message.content}</p>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Invoice Assistant</h1>
      </div>

      {/* Quick Queries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {quickQueries.map((query) => (
          <Button
            key={query.label}
            variant="outline"
            size="sm"
            onClick={() => handleQuickQuery(query.query)}
            className="flex items-center gap-2 h-auto p-3"
            disabled={isLoading}
          >
            {query.icon}
            <span className="text-xs">{query.label}</span>
          </Button>
        ))}
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className="flex-shrink-0">
                  {message.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {renderMessageContent(message)}
                  <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your invoices, payments, or suppliers..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(input)
                }
              }}
              disabled={isLoading}
            />
            <Button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}