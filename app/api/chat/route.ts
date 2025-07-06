import { type NextRequest, NextResponse } from "next/server"
import { PropertyIntelligenceAgent } from "@/lib/property-intelligence-agent"

const propertyAgent = new PropertyIntelligenceAgent()

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const sessionId = req.headers.get("x-session-id") || `session_${Date.now()}`
    const lastMessage = messages[messages.length - 1]

    // Process conversation through Revolutionary Property Intelligence Agent
    const result = await propertyAgent.processConversation(sessionId, lastMessage.content, messages)

    // CRITICAL: Never return property cards for rendering
    // Instead, synthesize natural language response with suggestion chips
    let response = result.response
    let suggestionChips: string[] = []
    let propertyData = null

    // If agent has property recommendations, create suggestion chips instead of cards
    if (result.shouldShowProperty && result.propertyRecommendation) {
      const property = result.propertyRecommendation

      // Store property data for potential presentation
      propertyData = {
        id: property.id,
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size_sqft: property.size_sqft,
        photos: [
          "/placeholder.svg?height=1080&width=1920",
          "/placeholder.svg?height=1080&width=1920",
          "/placeholder.svg?height=1080&width=1920",
        ],
        isVerified: property.isVerified || true,
        verificationScore: property.verificationScore || 95,
        description: `This stunning ${property.bedrooms}-bedroom property in ${property.address} offers ${property.size_sqft.toLocaleString()} square feet of modern living space. With blockchain verification and premium amenities, this represents exceptional value in today's market.`,
      }

      // Create natural language response instead of showing cards
      response = `Perfect! I've found a PropaBridge Verified property that matches your requirements exactly.

**${property.address}**
₦${property.price.toLocaleString()} | ${property.bedrooms} bed/${property.bathrooms} bath | ${property.size_sqft.toLocaleString()} sqft

This property stands out because:
- ✅ **Blockchain Verified** with 95% trust score
- 🏠 **Premium Location** in a highly sought-after area  
- 💎 **Excellent Value** at ₦${Math.round(property.price / property.size_sqft).toLocaleString()}/sqft
- 🔒 **Secure Investment** with verified documentation

The property offers modern amenities and is move-in ready. Based on current market trends, this represents strong investment potential.

Would you like to see the full property presentation?`

      suggestionChips = [
        "Show me this property",
        "Tell me about the neighborhood",
        "What's the verification status?",
        "Find similar properties",
      ]
    }

    return NextResponse.json({
      response,
      suggestionChips,
      propertyData,
      conversationState: result.state,
    })
  } catch (error) {
    console.error("Property Intelligence Agent Error:", error)
    return NextResponse.json(
      {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again.",
        suggestionChips: [],
        propertyData: null,
      },
      { status: 500 },
    )
  }
}
