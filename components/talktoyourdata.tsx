"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  User,
  Database,
  MessageSquare,
  Clock,
  Trash2,
  Sparkles,
  TrendingUp,
  BarChart3,
  Users,
} from "lucide-react"
// Removed: import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "query" | "response" | "error"
}

export function Talktoyourdata() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your CMS AI Assistant. I can help you query your database, analyze leads, check client information, generate reports, and much more. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
      type: "response",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Removed: runSupabaseCode function, as it will now run on the server

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // 1) push user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      type: "query",
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      // 2) Call your Next.js route, which will now handle both AI generation and Supabase execution
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      })
      const payload = await res.json()

      if (!res.ok) throw new Error(payload.error || "Unknown error")

      // 3) The payload now directly contains the data or error from the server-side execution
      const { data, error } = payload

      if (error) throw error

      // 4) push bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `✅ Here’s your data:\n${JSON.stringify(data, null, 2)}`,
        sender: "bot",
        timestamp: new Date(),
        type: "response",
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `Error: ${err.message}`,
          sender: "bot",
          timestamp: new Date(),
          type: "error",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: "1",
        content:
          "Hello! I'm your CMS AI Assistant. I can help you query your database, analyze leads, check client information, generate reports, and much more. What would you like to know?",
        sender: "bot",
        timestamp: new Date(),
        type: "response",
      },
    ])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const quickQuestions = [
    "Show me today's leads",
    "How many clients are expiring this month?",
    "What's my conversion rate?",
    "Show top performing coaches",
    "Generate sales report for this month",
    "Show leads by source",
  ]

  return (
    <div className="space-y-8 p-1">
      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                AI Queries Today
              </CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">47</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Database interactions</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Response Time</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">1.2s</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Average response</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Data Points</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">2.3K</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Records accessible</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Success Rate</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">98%</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Query accuracy</p>
          </CardContent>
        </Card>
      </div>
      {/* Modern Chat Interface */}
      <Card className="h-[650px] flex flex-col border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 shadow-xl">
        <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-800">
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Fitwiser CMS AI Assistant
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Connected to your database
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/50"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "bot" && (
                    <Avatar className="h-8 w-8 mt-1 border border-emerald-200 dark:border-emerald-800">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${message.sender === "user" ? "order-first" : ""}`}>
                    <div
                      className={`rounded-2xl px-5 py-3 shadow-sm ${
                        message.sender === "user"
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white ml-auto"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs text-muted-foreground ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 mt-1 border border-blue-200 dark:border-blue-800">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {/* Modern Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 mt-1 border border-emerald-200 dark:border-emerald-800">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          {/* Quick Questions */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-6 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">✨ Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:border-emerald-800 dark:hover:text-emerald-300 transition-all duration-200 bg-transparent"
                  onClick={() => setInputMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
          {/* Modern Input Area */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-6 bg-white/50 dark:bg-gray-900/50">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your CRM data..."
                  className="pr-12 h-12 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  disabled={isTyping}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              Try asking: "Show me leads from this week" or "What's my conversion rate?"
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Modern AI Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
              Database Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Query leads, clients, sales data, and generate custom reports with natural language.
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              Smart Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get insights, trends, and recommendations based on your CRM data patterns.
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              24/7 Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Always available to help with data analysis, reporting, and CRM management tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
