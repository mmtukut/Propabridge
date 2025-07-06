"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Shield, TrendingUp, MapPin, Bed, Bath, Square } from "lucide-react"
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
}

export default function PropaBridgeAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your PropaBridge Agent with deep expertise in Lagos and Abuja property markets. I'll help you find the perfect property through intelligent conversation. What kind of property are you looking for?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationState, setConversationState] = useState<ConversationState | null>(null)
  const [currentProperty, setCurrentProperty] = useState<PropertyRecommendation | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [sessionId] = useState(`session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
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
        setCurrentProperty(data.property)
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

      // Simulate connection success
      setTimeout(() => {
        const successMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Perfect! I've sent your connection request to the verified owner of ${currentProperty.address}. They'll contact you within 2 hours via your preferred method. 

🎉 **Mission Accomplished!** We've successfully matched you with a verified property that meets your exact requirements. 

Is there anything else I can help you with regarding this property or would you like to explore additional options?`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, successMessage])
      }, 1000)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Revolutionary Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">PB</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">PropaBridge Agent</h1>
            <p className="text-xs text-gray-600">Revolutionary Property Intelligence</p>
          </div>
        </div>

        {/* Conversation Intelligence Indicator */}
        {conversationState && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">
              Stage: {conversationState.conversationStage} | Confidence: {conversationState.confidence}%
            </div>
            <div
              className={`w-3 h-3 rounded-full ${
                conversationState.confidence > 80
                  ? "bg-green-500"
                  : conversationState.confidence > 50
                    ? "bg-yellow-500"
                    : "bg-blue-500"
              }`}
            />
          </div>
        )}
      </div>

      {/* Conversation Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-900 shadow-sm border border-gray-100"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {/* Property Recommendation Card */}
        {currentProperty && (
          <div className="flex justify-start">
            <Card className="max-w-md shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">₦{currentProperty.price.toLocaleString()}</h3>
                  {currentProperty.isVerified && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                      onClick={() => setShowVerification(true)}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Verified
                    </Button>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {currentProperty.address}
                </p>

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    {currentProperty.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    {currentProperty.bathrooms}
                  </div>
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-1" />
                    {currentProperty.size_sqft.toLocaleString()} sqft
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>₦{currentProperty.marketInsights.pricePerSqft.toLocaleString()}/sqft</span>
                  <Badge variant="outline" className="text-xs">
                    {currentProperty.marketInsights.marketTrend}
                  </Badge>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleConnectionRequest}>
                  Connect with Owner
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Intelligent Input Interface */}
      <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your ideal property..."
              className="pr-12 rounded-full border-gray-200 focus:border-blue-500 bg-white"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {conversationState && conversationState.confidence > 0 && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Understanding your needs: {conversationState.confidence}% complete
          </div>
        )}
      </div>

      {/* Blockchain Verification Modal */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Blockchain Verification Certificate
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-2">Property Verified ✅</h3>
              <p className="text-sm text-emerald-700">{currentProperty?.address}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Trust Score</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${currentProperty?.verificationScore || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{currentProperty?.verificationScore || 0}%</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Blockchain Address</label>
                <p className="text-xs text-blue-600 font-mono break-all">5xK9mN2pQr8sT3uV6wX7yZ1A2B3C4D5E6F7G8H9I0J</p>
              </div>

              <div>
                <label className="text-sm font-medium">Verified Documents</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {["Title Deed", "Survey Plan", "Building Permit", "Tax Clearance"].map((doc, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      ✅ {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
