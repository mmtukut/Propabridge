import { type NextRequest, NextResponse } from "next/server"
import { PropertyIntelligenceAgent } from "@/lib/property-intelligence-agent"
import { VectorPropertyDatabase } from "@/lib/vector-property-database"
import { BlockchainVerification } from "@/lib/blockchain-verification"

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

// Initialize Revolutionary Property Intelligence System
const propertyAgent = new PropertyIntelligenceAgent()
const vectorDB = new VectorPropertyDatabase()
const blockchainVerification = new BlockchainVerification()

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim().length < 20) {
      console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing or invalid")
      return new Response("Server configuration error", { status: 500 })
    }

    const { messages } = await req.json()
    const sessionId = req.headers.get("x-session-id") || `session_${Date.now()}`
    const lastMessage = messages[messages.length - 1]

    // Process conversation through Revolutionary Property Intelligence Agent
    const result = await propertyAgent.processConversation(sessionId, lastMessage.content, messages)

    let responseContent = result.response

    // If Agent recommends showing property, enhance with blockchain verification
    if (result.shouldShowProperty && result.propertyRecommendation) {
      const property = result.propertyRecommendation
      const certificate = await blockchainVerification.getVerificationCertificate(property.id)
      const trustBadge = certificate ? blockchainVerification.generateTrustBadge(certificate) : null

      // Enhanced property presentation with intelligence
      const propertyPresentation = `
🏠 **${property.address}**
💰 ₦${property.price.toLocaleString()} | 🛏️ ${property.bedrooms}bed/${property.bathrooms}bath | 📐 ${property.size_sqft.toLocaleString()} sqft

${trustBadge ? `${trustBadge.badge} - ${trustBadge.description}` : "⚠️ Verification Pending"}

**Market Intelligence:**
- Price per sqft: ₦${property.marketInsights.pricePerSqft.toLocaleString()}
- Market trend: ${property.marketInsights.marketTrend}
- Neighborhood score: ${property.marketInsights.neighborhoodScore}/10

**Why this property matches your needs:**
${result.state.context.location ? `✓ Located in your preferred area (${result.state.context.location})` : ""}
${result.state.context.budget ? `✓ Within your budget (₦${result.state.context.budget.max.toLocaleString()})` : ""}
${result.state.context.bedrooms ? `✓ Has ${property.bedrooms} bedrooms as requested` : ""}

**Ready to connect?** I can arrange immediate contact with the verified property owner.`

      responseContent += "\n\n" + propertyPresentation
    }

    // Return streaming response with conversation state
    return NextResponse.json({
      response: responseContent,
      conversationState: result.state,
      shouldShowProperty: result.shouldShowProperty,
      property: result.propertyRecommendation,
    })
  } catch (error) {
    console.error("Property Intelligence Agent Error:", error)
    return NextResponse.json({ error: "Agent temporarily unavailable" }, { status: 500 })
  }
}

// Analytics endpoint for Single-Session Resolution Rate tracking
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")

  if (sessionId) {
    const state = propertyAgent.getConversationState(sessionId)
    return NextResponse.json({
      sessionId,
      state,
      resolutionRate: state ? (state.confidence > 80 ? 100 : state.confidence) : 0,
    })
  }

  return NextResponse.json({ error: "Session ID required" }, { status: 400 })
}
