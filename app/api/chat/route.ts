import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import type { NextRequest } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Sample property database
const SAMPLE_PROPERTIES = [
  {
    id: "1",
    address: "123 Sunset Boulevard, Beverly Hills, CA",
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    size_sqft: 3200,
    neighborhood_vibe: "Upscale residential area with tree-lined streets, close to high-end shopping and dining.",
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
    neighborhood_vibe: "Vibrant beachfront community with stunning ocean views and world-class nightlife.",
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
    neighborhood_vibe: "Prestigious Upper East Side location with Central Park views and luxury amenities.",
    market_sentiment: "rising" as const,
    safety_rating: 8,
    family_friendliness: 7,
    is_verified: false,
    photos: ["/placeholder.svg?height=300&width=400"],
  },
]

function findMatchingProperties(userMessage: string): typeof SAMPLE_PROPERTIES {
  const message = userMessage.toLowerCase()

  // Simple keyword matching for demo
  if (message.includes("beach") || message.includes("ocean") || message.includes("miami")) {
    return SAMPLE_PROPERTIES.filter((p) => p.address.includes("Miami"))
  }

  if (message.includes("luxury") || message.includes("upscale") || message.includes("expensive")) {
    return SAMPLE_PROPERTIES.filter((p) => p.price > 2000000)
  }

  if (message.includes("family") || message.includes("kids") || message.includes("children")) {
    return SAMPLE_PROPERTIES.filter((p) => p.family_friendliness >= 7)
  }

  if (message.includes("safe") || message.includes("security")) {
    return SAMPLE_PROPERTIES.filter((p) => p.safety_rating >= 8)
  }

  // Default: return a couple of properties
  return SAMPLE_PROPERTIES.slice(0, 2)
}

const SYSTEM_PROMPT = `You are the PropaBridge Agent, an intelligent property assistant focused on achieving 90% Single-Session Resolution Rate. Your goal is to understand user needs through natural conversation and match them with perfect properties.

Key principles:
1. Be conversational, empathetic, and professional
2. Ask clarifying questions to understand their needs better
3. Focus on lifestyle and emotional needs, not just specs
4. Build trust through expertise and verification
5. Guide users toward connection requests when you find good matches
6. Always mention verification status when presenting properties

When users express interest in properties, present them as rich property cards with all details. Always highlight verification status and encourage connection requests for good matches.

Keep responses concise but warm. You're not just showing properties - you're helping people find their perfect home.`

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      console.error("Google Generative AI API key is missing")
      return new Response("API configuration error", { status: 500 })
    }

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.trim().length < 20) {
      console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing or clearly invalid")
      return new Response("Server configuration error", { status: 500 })
    }

    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    // Check if we should show properties based on the conversation
    const shouldShowProperties =
      messages.length > 2 ||
      lastMessage.content.toLowerCase().includes("show") ||
      lastMessage.content.toLowerCase().includes("find") ||
      lastMessage.content.toLowerCase().includes("looking for")

    let responseContent = ""

    if (shouldShowProperties) {
      const matchingProperties = findMatchingProperties(lastMessage.content)

      if (matchingProperties.length > 0) {
        responseContent = `Based on what you're looking for, I found ${matchingProperties.length} properties that might be perfect for you. Let me show you the details:

${matchingProperties
  .map(
    (property) => `
🏠 **${property.address}**
💰 $${property.price.toLocaleString()}
🛏️ ${property.bedrooms} bed, ${property.bathrooms} bath, ${property.size_sqft.toLocaleString()} sqft
${property.is_verified ? "✅ **Verified Property** - Blockchain certified!" : "⚠️ Verification pending"}

${property.neighborhood_vibe}

Market trend: ${property.market_sentiment} | Safety: ${property.safety_rating}/10 | Family-friendly: ${property.family_friendliness}/10
`,
  )
  .join("\n")}

${matchingProperties.some((p) => p.is_verified) ? 'The verified properties come with our blockchain-backed verification certificates - tap the "Verified" badge to see the full verification details!' : ""}

Would you like to connect with any of these property owners? I can arrange that for you right away!`
      }
    }

    const result = await streamText({
      model: google("gemini-2.0-flash", { apiKey: GOOGLE_API_KEY }),
      system: SYSTEM_PROMPT,
      messages: messages,
      ...(responseContent && {
        prompt: `User message: "${lastMessage.content}"\n\nRespond with this content: ${responseContent}`,
      }),
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
