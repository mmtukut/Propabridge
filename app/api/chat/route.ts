import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import type { NextRequest } from "next/server"
import { VectorSearch } from "@/lib/vector-search"
import { NeighborhoodIntelligence } from "@/lib/neighborhood-intelligence"
import { BlockchainVerification } from "@/lib/blockchain-verification"
import { ConversationRecovery } from "@/lib/conversation-recovery"

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Enhanced property database with more properties
const ENHANCED_PROPERTIES = [
  {
    id: "1",
    address: "123 Sunset Boulevard, Beverly Hills, CA",
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    size_sqft: 3200,
    neighborhood_vibe:
      "Upscale residential area with tree-lined streets, close to high-end shopping and dining. Perfect for families seeking luxury and convenience.",
    market_sentiment: "rising" as const,
    safety_rating: 9,
    family_friendliness: 8,
    is_verified: true,
    photos: ["/placeholder.svg?height=300&width=400"],
    verification_certificate: {
      nft_address: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0",
      verified_by: "PropaBridge Verification Team",
      verification_date: "2024-01-15",
      documents_verified: ["title_deed", "survey_plan", "building_permit", "tax_clearance"],
    },
  },
  {
    id: "2",
    address: "456 Ocean Drive, Miami Beach, FL",
    price: 1800000,
    bedrooms: 3,
    bathrooms: 2,
    size_sqft: 2100,
    neighborhood_vibe:
      "Vibrant beachfront community with stunning ocean views and world-class nightlife. Ideal for young professionals and entertainment lovers.",
    market_sentiment: "stable" as const,
    safety_rating: 7,
    family_friendliness: 6,
    is_verified: true,
    photos: ["/placeholder.svg?height=300&width=400"],
    verification_certificate: {
      nft_address: "B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1",
      verified_by: "PropaBridge Verification Team",
      verification_date: "2024-01-20",
      documents_verified: ["title_deed", "survey_plan", "environmental_clearance"],
    },
  },
  {
    id: "3",
    address: "789 Park Avenue, New York, NY",
    price: 3200000,
    bedrooms: 2,
    bathrooms: 2,
    size_sqft: 1800,
    neighborhood_vibe:
      "Prestigious Upper East Side location with Central Park views and luxury amenities. Perfect for sophisticated urban living.",
    market_sentiment: "rising" as const,
    safety_rating: 8,
    family_friendliness: 7,
    is_verified: false,
    photos: ["/placeholder.svg?height=300&width=400"],
  },
  {
    id: "4",
    address: "321 Tech Hub Lane, San Francisco, CA",
    price: 2800000,
    bedrooms: 3,
    bathrooms: 2.5,
    size_sqft: 2400,
    neighborhood_vibe:
      "Modern tech district with innovative architecture and startup energy. Great for tech professionals and entrepreneurs.",
    market_sentiment: "rising" as const,
    safety_rating: 8,
    family_friendliness: 7,
    is_verified: true,
    photos: ["/placeholder.svg?height=300&width=400"],
    verification_certificate: {
      nft_address: "C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2",
      verified_by: "PropaBridge Verification Team",
      verification_date: "2024-01-25",
      documents_verified: ["title_deed", "survey_plan", "building_permit"],
    },
  },
]

// Initialize enhanced services
const vectorSearch = new VectorSearch()
const neighborhoodIntel = new NeighborhoodIntelligence()
const blockchainVerification = new BlockchainVerification()
const conversationRecovery = new ConversationRecovery()

// Populate vector search with properties
ENHANCED_PROPERTIES.forEach((property) => {
  vectorSearch.addProperty(property)
})

async function findMatchingProperties(userMessage: string, sessionId: string): Promise<typeof ENHANCED_PROPERTIES> {
  // Update conversation context
  const preferences = conversationRecovery.extractPreferences(userMessage)
  conversationRecovery.updateContext(sessionId, { preferences })

  // Use semantic search for better matching
  const semanticResults = await vectorSearch.semanticSearch(userMessage, 4)

  // Fallback to keyword matching if semantic search returns few results
  if (semanticResults.length < 2) {
    const message = userMessage.toLowerCase()

    if (message.includes("beach") || message.includes("ocean") || message.includes("miami")) {
      return ENHANCED_PROPERTIES.filter((p) => p.address.includes("Miami"))
    }

    if (message.includes("luxury") || message.includes("upscale") || message.includes("expensive")) {
      return ENHANCED_PROPERTIES.filter((p) => p.price > 2000000)
    }

    if (message.includes("family") || message.includes("kids") || message.includes("children")) {
      return ENHANCED_PROPERTIES.filter((p) => p.family_friendliness >= 7)
    }

    if (message.includes("tech") || message.includes("startup") || message.includes("san francisco")) {
      return ENHANCED_PROPERTIES.filter((p) => p.address.includes("San Francisco"))
    }

    return ENHANCED_PROPERTIES.slice(0, 2)
  }

  return semanticResults
}

const ENHANCED_SYSTEM_PROMPT = `You are the PropaBridge Agent, an advanced AI property assistant with deep market intelligence and blockchain verification capabilities. Your mission is to achieve 90% Single-Session Resolution Rate through intelligent conversation and comprehensive property insights.

Enhanced Capabilities:
🧠 **Semantic Understanding** - Advanced property matching beyond keywords
🏘️ **Neighborhood Intelligence** - Deep local market insights and trends  
🔗 **Blockchain Verification** - Institutional-grade property verification
🎯 **Conversation Recovery** - Graceful handling of confusion and clarification
📊 **Market Analytics** - Real-time pricing trends and investment insights

Conversation Principles:
1. **Empathetic Engagement** - Understand emotional and lifestyle needs
2. **Intelligent Matching** - Use context and preferences for better results
3. **Trust Building** - Highlight verification and provide market insights
4. **Graceful Recovery** - Handle confusion with helpful clarification
5. **Action Orientation** - Guide toward connection requests and next steps

When presenting properties, include:
- Rich neighborhood insights and market trends
- Blockchain verification status with trust indicators
- Lifestyle compatibility analysis
- Investment potential and market dynamics

Keep responses conversational, insightful, and action-oriented. You're not just showing properties - you're providing intelligent property advisory services.`

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim().length < 20) {
      console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing or invalid")
      return new Response("Server configuration error", { status: 500 })
    }

    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]
    const sessionId = req.headers.get("x-session-id") || "default-session"

    // Check for confusion and handle recovery
    if (conversationRecovery.detectConfusion(lastMessage.content)) {
      const context = conversationRecovery.getContext(sessionId)
      if (context) {
        context.recoveryAttempts += 1
        const recoveryResponse = conversationRecovery.generateRecoveryResponse(context)

        const result = await streamText({
          model: google("gemini-2.0-flash", { apiKey: GOOGLE_API_KEY }),
          system: ENHANCED_SYSTEM_PROMPT,
          messages: [...messages, { role: "assistant", content: recoveryResponse }],
        })

        return result.toDataStreamResponse()
      }
    }

    // Determine if we should show properties
    const shouldShowProperties =
      messages.length > 2 ||
      lastMessage.content.toLowerCase().includes("show") ||
      lastMessage.content.toLowerCase().includes("find") ||
      lastMessage.content.toLowerCase().includes("looking for") ||
      lastMessage.content.toLowerCase().includes("search")

    if (shouldShowProperties) {
      const matchingProperties = await findMatchingProperties(lastMessage.content, sessionId)

      if (matchingProperties.length > 0) {
        // Generate enhanced property presentations with intelligence
        const propertyPresentations = await Promise.all(
          matchingProperties.map(async (property) => {
            const neighborhoodInsights = neighborhoodIntel.generateInsights(property)
            const verificationBadge = property.is_verified
              ? "✅ **Blockchain Verified** - Premium verification with institutional trust score"
              : "⚠️ **Verification Pending** - Documents under blockchain review"

            return `
🏠 **${property.address}**
💰 $${property.price.toLocaleString()} | 🛏️ ${property.bedrooms}bed/${property.bathrooms}bath | 📐 ${property.size_sqft.toLocaleString()} sqft

${verificationBadge}

**Neighborhood Vibe**: ${property.neighborhood_vibe}

${neighborhoodInsights}

**Market Status**: ${property.market_sentiment} | Safety: ${property.safety_rating}/10 | Family Score: ${property.family_friendliness}/10
`
          }),
        )

        const enhancedResponse = `Based on your preferences, I've found ${matchingProperties.length} exceptional properties with deep market intelligence:

${propertyPresentations.join("\n---\n")}

💡 **PropaBridge Intelligence**: All verified properties include blockchain certificates, neighborhood analytics, and market trend data.

Ready to connect with any property owners? I can arrange immediate contact and provide additional market insights!`

        const result = await streamText({
          model: google("gemini-2.0-flash", { apiKey: GOOGLE_API_KEY }),
          system: ENHANCED_SYSTEM_PROMPT + "\n\nProperty Data:\n" + enhancedResponse,
          messages,
        })

        return result.toDataStreamResponse()
      }
    }

    // Standard conversation flow
    const result = await streamText({
      model: google("gemini-2.0-flash", { apiKey: GOOGLE_API_KEY }),
      system: ENHANCED_SYSTEM_PROMPT,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
