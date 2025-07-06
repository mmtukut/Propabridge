"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Mic, Shield, TrendingUp, MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ConversationState {
  sessionId: string
  confidence: number
  conversationStage: string
  context: any
}

interface PropertyRecommendation {
  id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  size_sqft: number
  isVerified: boolean
  verificationScore: number
  marketInsights: {
    pricePerSqft: number
    marketTrend: string
    neighborhoodScore: number
  }
  photos: string[]
}

export default function PropaBridgeAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState | null>(null)
  const [currentProperty, setCurrentProperty] = useState<PropertyRecommendation | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}`)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setShowWelcome(false)

    // Add welcome message from agent
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm your PropaBridge Agent with deep expertise in Lagos and Abuja property markets. I understand you're looking for "${input}". Let me help you find the perfect property through our intelligent conversation.`,
      timestamp: new Date(),
    }

    setMessages([welcomeMessage])
    await handleConversation(input)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await handleConversation(input)
  }

  const handleConversation = async (userInput: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setConversationState(data.conversationState)

      if (data.shouldShowProperty && data.property) {
        setCurrentProperty({
          ...data.property,
          photos: ["/placeholder.svg?height=400&width=600", "/placeholder.svg?height=400&width=600"],
        })
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm experiencing technical difficulties. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectionRequest = () => {
    if (currentProperty) {
      const connectionMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `I'd like to connect with the owner of ${currentProperty.address}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, connectionMessage])

      setTimeout(() => {
        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `🎉 **Perfect!** I've connected you with the verified owner of ${currentProperty.address}. They'll contact you within 2 hours.

**Mission Accomplished!** We've successfully matched you with a blockchain-verified property that meets your exact requirements.

Would you like to explore additional options or need help with anything else?`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, successMessage])
      }, 1000)
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Voice input implementation would go here
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        {/* Floating Property Silhouettes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-16 h-12 bg-white/5 rounded transform rotate-12 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-20 h-16 bg-white/5 rounded transform -rotate-6 animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-12 h-10 bg-white/5 rounded transform rotate-45 animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/3 w-18 h-14 bg-white/5 rounded transform -rotate-12 animate-pulse delay-3000"></div>
        </div>

        <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
          {/* Hero Typography */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Your Perfect Home is Just a{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Conversation Away
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-lg mx-auto leading-relaxed">
              Revolutionary property intelligence powered by blockchain verification and conversational AI
            </p>
          </div>

          {/* Conversation Entry */}
          <form onSubmit={handleWelcomeSubmit} className="space-y-6">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your dream home..."
                className="w-full h-16 text-lg px-6 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder-white/60 rounded-2xl focus:bg-white/15 focus:border-amber-400/50 transition-all duration-300"
              />
              <Button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 transition-all duration-300 ${
                  isListening ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
                }`}
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>

            {/* Voice Wave Animation */}
            {isListening && (
              <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-amber-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.5s",
                    }}
                  />
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={!input.trim()}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              Start Your Property Journey
            </Button>
          </form>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Blockchain Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Market Intelligence</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Lagos & Abuja Expert</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sophisticated Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">PB</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">PropaBridge Agent</h1>
              <p className="text-xs text-slate-600">Revolutionary Property Intelligence</p>
            </div>
          </div>

          {/* Conversation Intelligence */}
          {conversationState && (
            <div className="flex items-center space-x-3">
              <div className="text-xs text-slate-600">
                {conversationState.conversationStage} • {conversationState.confidence}%
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Conversation Canvas */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-3xl px-6 py-4 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white/70 backdrop-blur-sm text-slate-900 shadow-lg shadow-slate-500/10 border border-white/50"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <div className={`text-xs mt-2 ${message.role === "user" ? "text-blue-100" : "text-slate-500"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {/* Premium Property Card */}
        {currentProperty && (
          <div className="flex justify-start">
            <Card className="max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden group hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
              {/* Property Image Gallery */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={currentProperty.photos[0] || "/placeholder.svg"}
                  alt={currentProperty.address}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Verification Badge */}
                {currentProperty.isVerified && (
                  <Button
                    onClick={() => setShowVerification(true)}
                    className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 rounded-full px-3 py-1 text-xs font-semibold shadow-lg"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Button>
                )}

                {/* Price Overlay */}
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-white">₦{currentProperty.price.toLocaleString()}</h3>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    {currentProperty.address}
                  </p>

                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1 text-slate-400" />
                      {currentProperty.bedrooms} bed
                    </div>
                    <div className="flex items-center">
                      <Bath className="w-4 h-4 mr-1 text-slate-400" />
                      {currentProperty.bathrooms} bath
                    </div>
                    <div className="flex items-center">
                      <Square className="w-4 h-4 mr-1 text-slate-400" />
                      {currentProperty.size_sqft.toLocaleString()} sqft
                    </div>
                  </div>
                </div>

                {/* Market Intelligence */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Market Intelligence</span>
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">
                      ₦{currentProperty.marketInsights.pricePerSqft.toLocaleString()}/sqft
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {currentProperty.marketInsights.marketTrend}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleConnectionRequest}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Connect with Owner
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sophisticated Loading */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl px-6 py-4 shadow-lg border border-white/50">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">Analyzing your requirements...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Elegant Input Interface */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Continue our conversation..."
                className="h-12 px-6 bg-white/70 backdrop-blur-sm border-slate-200 rounded-2xl focus:bg-white focus:border-blue-400 transition-all duration-300"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full p-0 transition-all duration-300 ${
                  isListening ? "bg-red-500 hover:bg-red-600" : "bg-slate-200 hover:bg-slate-300"
                }`}
              >
                <Mic className="w-3 h-3" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Confidence Indicator */}
          {conversationState && conversationState.confidence > 0 && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center space-x-2 text-xs text-slate-500">
                <span>Understanding your needs</span>
                <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${conversationState.confidence}%` }}
                  />
                </div>
                <span>{conversationState.confidence}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Verification Certificate Modal */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>Blockchain Certificate</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Premium Certificate Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">Premium Verified</h3>
              <p className="text-sm text-amber-700">{currentProperty?.address}</p>
            </div>

            {/* Trust Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Trust Score</span>
                <span className="text-lg font-bold text-emerald-600">{currentProperty?.verificationScore}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-1000"
                  style={{ width: `${currentProperty?.verificationScore || 0}%` }}
                />
              </div>
            </div>

            {/* Blockchain Details */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Blockchain Address</label>
                <p className="text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded-lg mt-1 break-all">
                  5xK9mN2pQr8sT3uV6wX7yZ1A2B3C4D5E6F7G8H9I0J
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Verified Documents</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Title Deed", "Survey Plan", "Building Permit", "Tax Clearance"].map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-emerald-50 p-2 rounded-lg">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-xs text-emerald-700">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verifier Credentials */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Verified By</h4>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PB</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">PropaBridge Network</p>
                  <p className="text-xs text-slate-600">Licensed Verification Authority</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
