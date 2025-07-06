"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Send, Mic, MicOff, Shield, MapPin, Bed, Bath, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Property {
  id: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  size_sqft: number
  neighborhood_vibe: string
  market_sentiment: "rising" | "stable" | "declining"
  safety_rating: number
  family_friendliness: number
  is_verified: boolean
  photos: string[]
  verification_certificate?: {
    nft_address: string
    verified_by: string
    verification_date: string
    documents_verified: string[]
  }
}

interface PropertyCardProps {
  property: Property
  onVerificationClick: (property: Property) => void
  onConnectionRequest: (property: Property) => void
}

function PropertyCard({ property, onVerificationClick, onConnectionRequest }: PropertyCardProps) {
  return (
    <Card className="w-full max-w-sm mx-auto my-4 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="relative">
        <img
          src={property.photos[0] || "/placeholder.svg"}
          alt={property.address}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        {property.is_verified && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
            onClick={() => onVerificationClick(property)}
          >
            <Shield className="w-4 h-4 mr-1" />
            Verified
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900">${property.price.toLocaleString()}</h3>
          <Badge variant={property.market_sentiment === "rising" ? "default" : "secondary"}>
            {property.market_sentiment}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-3 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          {property.address}
        </p>

        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            {property.bedrooms}
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            {property.bathrooms}
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            {property.size_sqft.toLocaleString()} sqft
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">{property.neighborhood_vibe}</p>

        <div className="flex gap-2">
          <div className="text-xs text-gray-500">
            Safety: {property.safety_rating}/10 • Family: {property.family_friendliness}/10
          </div>
        </div>

        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => onConnectionRequest(property)}>
          Request Connection
        </Button>
      </CardContent>
    </Card>
  )
}

interface VerificationModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
}

function VerificationModal({ property, isOpen, onClose }: VerificationModalProps) {
  if (!property?.verification_certificate) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Verification Certificate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-emerald-800 mb-2">Property Verified</h3>
            <p className="text-sm text-emerald-700">{property.address}</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Verified By</Label>
              <p className="text-sm text-gray-600">{property.verification_certificate.verified_by}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Verification Date</Label>
              <p className="text-sm text-gray-600">{property.verification_certificate.verification_date}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Documents Verified</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {property.verification_certificate.documents_verified.map((doc, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {doc.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Blockchain Certificate</Label>
              <p className="text-xs text-blue-600 font-mono break-all">
                {property.verification_certificate.nft_address}
              </p>
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <a
                  href={`https://explorer.solana.com/address/${property.verification_certificate.nft_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Solana Explorer
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ConnectionModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

function ConnectionModal({ property, isOpen, onClose, onSubmit }: ConnectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_contact: "email",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, property_id: property?.id })
    setFormData({ name: "", email: "", phone: "", preferred_contact: "email", message: "" })
    onClose()
  }

  if (!property) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Connect with Property Owner</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium text-sm">{property.address}</p>
          <p className="text-sm text-gray-600">${property.price.toLocaleString()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any specific questions or requirements..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PropaBridgeChat() {
  const [isListening, setIsListening] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [showConnection, setShowConnection] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Hi! I'm your PropaBridge Agent. I'm here to help you find the perfect property. What kind of home are you looking for today?",
      },
    ],
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleVerificationClick = (property: Property) => {
    setSelectedProperty(property)
    setShowVerification(true)
  }

  const handleConnectionRequest = (property: Property) => {
    setSelectedProperty(property)
    setShowConnection(true)
  }

  const handleConnectionSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // Add success message to chat
        const successMessage = {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: `Perfect! I've sent your connection request for ${selectedProperty?.address}. The property owner will contact you within 24 hours via your preferred method. Is there anything else I can help you with?`,
        }
        // Note: In a real implementation, you'd add this to the chat messages
      }
    } catch (error) {
      console.error("Failed to submit connection request:", error)
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // Voice-to-text implementation would go here
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">PB</span>
          </div>
          <span className="font-semibold text-gray-900">PropaBridge Agent</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Tell me about your ideal home..."
              className="pr-12 rounded-full border-gray-200 focus:border-blue-500"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-8 h-8 p-0 ${
                isListening ? "text-red-500" : "text-gray-400"
              }`}
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Modals */}
      <VerificationModal
        property={selectedProperty}
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
      />

      <ConnectionModal
        property={selectedProperty}
        isOpen={showConnection}
        onClose={() => setShowConnection(false)}
        onSubmit={handleConnectionSubmit}
      />
    </div>
  )
}
