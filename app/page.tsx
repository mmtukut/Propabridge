"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Mic, X, ChevronLeft, ChevronRight, Shield, MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  suggestionChips?: string[]
}

interface Property {
  id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  size_sqft: number
  photos: string[]
  isVerified: boolean
  verificationScore: number
  description: string
}

type AppState = "CONVERSING" | "PRESENTING"

export default function PropaBridgeAgent() {
  const [appState, setAppState] = useState<AppState>("CONVERSING")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
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
        suggestionChips: data.suggestionChips || [],
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Store property data for potential presentation
      if (data.propertyData) {
        setCurrentProperty(data.propertyData)
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

  const handleSuggestionChip = (suggestion: string) => {
    if (suggestion.toLowerCase().includes("show me") || suggestion.toLowerCase().includes("see it")) {
      // Transition to PRESENTING state
      setAppState("PRESENTING")
      setCurrentPhotoIndex(0)
    } else {
      // Continue conversation
      handleConversation(suggestion)
    }
  }

  const handleConnectionRequest = () => {
    setAppState("CONVERSING")
    const connectionMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `🎉 **Perfect!** I've connected you with the verified owner of ${currentProperty?.address}. They'll contact you within 2 hours.

**Mission Accomplished!** We've successfully matched you with a blockchain-verified property that meets your exact requirements.

Would you like to explore additional options or need help with anything else?`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, connectionMessage])
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
  }

  // IMMERSIVE MEDIA VIEWER - Full Screen Property Presentation
  if (appState === "PRESENTING" && currentProperty) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Close Button */}
        <Button
          onClick={() => setAppState("CONVERSING")}
          className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Photo Navigation */}
        {currentProperty.photos.length > 1 && (
          <>
            <Button
              onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
              disabled={currentPhotoIndex === 0}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => setCurrentPhotoIndex(Math.min(currentProperty.photos.length - 1, currentPhotoIndex + 1))}
              disabled={currentPhotoIndex === currentProperty.photos.length - 1}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Full Screen Image */}
        <div className="relative w-full h-full">
          <img
            src={currentProperty.photos[currentPhotoIndex] || "/placeholder.svg?height=1080&width=1920"}
            alt={currentProperty.address}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        {/* Property Information Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Price and Verification */}
            <div className="flex items-center justify-between">
              <h1 className="text-4xl md:text-6xl font-bold">₦{currentProperty.price.toLocaleString()}</h1>
              {currentProperty.isVerified && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-2 text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Blockchain Verified
                </Badge>
              )}
            </div>

            {/* Address */}
            <p className="text-xl md:text-2xl text-white/90 flex items-center">
              <MapPin className="w-6 h-6 mr-3" />
              {currentProperty.address}
            </p>

            {/* Property Details */}
            <div className="flex items-center space-x-8 text-lg text-white/80">
              <div className="flex items-center">
                <Bed className="w-5 h-5 mr-2" />
                {currentProperty.bedrooms} bedrooms
              </div>
              <div className="flex items-center">
                <Bath className="w-5 h-5 mr-2" />
                {currentProperty.bathrooms} bathrooms
              </div>
              <div className="flex items-center">
                <Square className="w-5 h-5 mr-2" />
                {currentProperty.size_sqft.toLocaleString()} sqft
              </div>
            </div>

            {/* Description */}
            <p className="text-lg text-white/90 max-w-3xl leading-relaxed">{currentProperty.description}</p>

            {/* Photo Counter */}
            {currentProperty.photos.length > 1 && (
              <div className="flex items-center space-x-2">
                {currentProperty.photos.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentPhotoIndex ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4">
              <Button
                onClick={handleConnectionRequest}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105"
              >
                Connect with Owner
              </Button>
              <Button
                onClick={() => setAppState("CONVERSING")}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 text-lg rounded-2xl backdrop-blur-sm border border-white/30"
              >
                Continue Conversation
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // WELCOME SCREEN
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
        </div>
      </div>
    )
  }

  // CONVERSATION INTERFACE
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
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
        </div>
      </div>

      {/* Conversation Canvas */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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

            {/* Suggestion Chips */}
            {message.suggestionChips && message.suggestionChips.length > 0 && (
              <div className="flex justify-start">
                <div className="flex flex-wrap gap-2 max-w-[80%]">
                  {message.suggestionChips.map((chip, index) => (
                    <Button
                      key={index}
                      onClick={() => handleSuggestionChip(chip)}
                      className="bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-full px-4 py-2 text-sm transition-all duration-200 transform hover:scale-105"
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
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

      {/* Input Interface */}
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
        </div>
      </div>
    </div>
  )
}
