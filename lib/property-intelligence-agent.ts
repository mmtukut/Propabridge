// Revolutionary Property Intelligence Agent - Core Brain
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export interface PropertyContext {
  location: string
  budget: { min: number; max: number; currency: "NGN" | "USD" }
  bedrooms: number
  propertyType: "apartment" | "house" | "duplex" | "penthouse"
  lifestyle: string[]
  urgency: "immediate" | "within_month" | "exploring"
  dealBreakers: string[]
}

export interface ConversationState {
  sessionId: string
  userId: string
  context: Partial<PropertyContext>
  conversationStage: "discovery" | "matching" | "verification" | "connection"
  confidence: number // 0-100, how confident we are in the match
  propertiesShown: string[]
  lastInteraction: Date
  resolutionAttempts: number
}

export class PropertyIntelligenceAgent {
  private conversationStates: Map<string, ConversationState> = new Map()

  // Lagos/Abuja specific system prompt with deep market knowledge
  private readonly LAGOS_ABUJA_SYSTEM_PROMPT =
    `You are PropaBridge Agent, the most intelligent property discovery system in Nigeria. You have deep expertise in Lagos and Abuja property markets.

CORE MISSION: Achieve 90% Single-Session Resolution Rate by understanding user needs and matching them with perfect properties through intelligent conversation.

LAGOS MARKET INTELLIGENCE:
- Victoria Island: Premium business district, ₦5M-₦15M for 3BR, high security, traffic challenges
- Ikoyi: Ultra-luxury residential, ₦8M-₦25M for 3BR, excellent infrastructure, expatriate community  
- Lekki Phase 1: Modern developments, ₦4M-₦12M for 3BR, good amenities, growing area
- Ajah: Emerging area, ₦2M-₦6M for 3BR, value for money, longer commute to VI/Ikoyi
- Surulere: Established middle-class, ₦3M-₦8M for 3BR, central location, mixed infrastructure

ABUJA MARKET INTELLIGENCE:
- Maitama: Diplomatic zone, ₦6M-₦20M for 3BR, highest security, premium location
- Asokoro: Government residential, ₦5M-₦15M for 3BR, excellent security, established area
- Wuse 2: Business district proximity, ₦4M-₦10M for 3BR, commercial convenience
- Gwarinpa: Largest estate, ₦3M-₦8M for 3BR, family-friendly, planned development
- Kubwa: Satellite town, ₦2M-₦5M for 3BR, affordable, longer commute

CONVERSATION INTELLIGENCE:
1. DISCOVERY PHASE: Extract location, budget, size, lifestyle through natural conversation
2. MATCHING PHASE: Use semantic understanding to find perfect property matches
3. VERIFICATION PHASE: Present blockchain-verified properties with trust indicators
4. CONNECTION PHASE: Facilitate immediate connection with property owners

RESPONSE RULES:
- Never ask more than 2 questions at once
- Always provide market insights with recommendations
- Build trust through specific local knowledge
- Guide toward connection request when confidence > 80%
- Use Nigerian context and currency (₦) naturally

FAILURE CONDITIONS:
- Generic responses without local market knowledge
- Inability to understand property context from conversation
- More than 5 exchanges without property recommendation
- User confusion or frustration

You are not a chatbot. You are an intelligent property advisor with deep Lagos/Abuja expertise.`

  async processConversation(
    sessionId: string,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<{
    response: string
    state: ConversationState
    shouldShowProperty: boolean
    propertyRecommendation?: any
  }> {
    // Get or create conversation state
    let state = this.conversationStates.get(sessionId) || {
      sessionId,
      userId: "user_" + sessionId,
      context: {},
      conversationStage: "discovery",
      confidence: 0,
      propertiesShown: [],
      lastInteraction: new Date(),
      resolutionAttempts: 0,
    }

    // Extract context from user message
    const extractedContext = this.extractPropertyContext(userMessage)
    state.context = { ...state.context, ...extractedContext }

    // Determine conversation stage and confidence
    state = this.updateConversationState(state, userMessage)

    // Generate intelligent response using Gemini
    const response = await this.generateIntelligentResponse(state, userMessage, conversationHistory)

    // Update state
    state.lastInteraction = new Date()
    this.conversationStates.set(sessionId, state)

    // Determine if we should show property
    const shouldShowProperty = state.confidence > 70 && state.conversationStage === "matching"

    let propertyRecommendation = null
    if (shouldShowProperty) {
      propertyRecommendation = await this.findPerfectMatch(state.context)
    }

    return {
      response,
      state,
      shouldShowProperty,
      propertyRecommendation,
    }
  }

  private extractPropertyContext(message: string): Partial<PropertyContext> {
    const context: Partial<PropertyContext> = {}
    const lowerMessage = message.toLowerCase()

    // Location extraction with Lagos/Abuja intelligence
    const locations = [
      "victoria island",
      "vi",
      "ikoyi",
      "lekki",
      "ajah",
      "surulere",
      "maitama",
      "asokoro",
      "wuse",
      "gwarinpa",
      "kubwa",
    ]
    const foundLocation = locations.find((loc) => lowerMessage.includes(loc))
    if (foundLocation) {
      context.location = foundLocation
    }

    // Budget extraction (Nigerian context)
    const budgetMatch = message.match(/₦([\d,]+(?:\.\d+)?)\s*(?:million|m)?/i)
    if (budgetMatch) {
      const amount = Number.parseFloat(budgetMatch[1].replace(/,/g, ""))
      const isMillions = message.toLowerCase().includes("million") || message.toLowerCase().includes("m")
      context.budget = {
        max: isMillions ? amount * 1000000 : amount,
        min: 0,
        currency: "NGN",
      }
    }

    // Bedroom extraction
    const bedroomMatch = message.match(/(\d+)[\s-]*(?:bed|bedroom)/i)
    if (bedroomMatch) {
      context.bedrooms = Number.parseInt(bedroomMatch[1])
    }

    // Property type extraction
    if (lowerMessage.includes("apartment")) context.propertyType = "apartment"
    if (lowerMessage.includes("house")) context.propertyType = "house"
    if (lowerMessage.includes("duplex")) context.propertyType = "duplex"
    if (lowerMessage.includes("penthouse")) context.propertyType = "penthouse"

    // Lifestyle extraction
    const lifestyleKeywords = []
    if (lowerMessage.includes("family")) lifestyleKeywords.push("family-friendly")
    if (lowerMessage.includes("security")) lifestyleKeywords.push("high-security")
    if (lowerMessage.includes("quiet")) lifestyleKeywords.push("quiet-area")
    if (lowerMessage.includes("business")) lifestyleKeywords.push("business-district")
    if (lifestyleKeywords.length > 0) {
      context.lifestyle = lifestyleKeywords
    }

    return context
  }

  private updateConversationState(state: ConversationState, userMessage: string): ConversationState {
    const { context } = state

    // Calculate confidence based on context completeness
    let confidence = 0
    if (context.location) confidence += 30
    if (context.budget) confidence += 25
    if (context.bedrooms) confidence += 20
    if (context.propertyType) confidence += 15
    if (context.lifestyle && context.lifestyle.length > 0) confidence += 10

    // Determine conversation stage
    let conversationStage: ConversationState["conversationStage"] = "discovery"
    if (confidence > 50) conversationStage = "matching"
    if (confidence > 80) conversationStage = "verification"

    return {
      ...state,
      confidence,
      conversationStage,
    }
  }

  private async generateIntelligentResponse(
    state: ConversationState,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const contextPrompt = `
CURRENT CONVERSATION STATE:
- Stage: ${state.conversationStage}
- Confidence: ${state.confidence}%
- Context: ${JSON.stringify(state.context, null, 2)}

USER MESSAGE: "${userMessage}"

INSTRUCTIONS:
${this.getStageSpecificInstructions(state)}
`

    try {
      const { text } = await generateText({
        model: google("gemini-2.0-flash", { apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }),
        system: this.LAGOS_ABUJA_SYSTEM_PROMPT,
        prompt: contextPrompt,
      })

      return text
    } catch (error) {
      console.error("Gemini API error:", error)
      return this.getFallbackResponse(state)
    }
  }

  private getStageSpecificInstructions(state: ConversationState): string {
    switch (state.conversationStage) {
      case "discovery":
        return `DISCOVERY PHASE: You need more information. Ask intelligent follow-up questions about missing context: ${
          !state.context.location ? "location, " : ""
        }${!state.context.budget ? "budget, " : ""}${!state.context.bedrooms ? "size, " : ""}${
          !state.context.lifestyle ? "lifestyle preferences" : ""
        }. Provide market insights while asking.`

      case "matching":
        return `MATCHING PHASE: You have enough context (${state.confidence}% confidence). Present property recommendations with specific Lagos/Abuja market insights. Build trust through local expertise.`

      case "verification":
        return `VERIFICATION PHASE: Present blockchain-verified properties with trust indicators. Focus on building confidence for connection request.`

      case "connection":
        return `CONNECTION PHASE: Guide user toward connection request. Provide final assurance and facilitate immediate contact.`

      default:
        return "Continue intelligent conversation focused on property discovery."
    }
  }

  private getFallbackResponse(state: ConversationState): string {
    if (state.confidence < 50) {
      return `I understand you're looking for property in Lagos or Abuja. To find your perfect match, I need to understand your specific needs better. 

Could you tell me:
- Which area interests you most? (Victoria Island, Ikoyi, Lekki, Maitama, etc.)
- What's your budget range?
- How many bedrooms do you need?

I have deep knowledge of both markets and can provide specific insights once I understand your requirements.`
    }

    return `Based on what you've shared, I'm getting a clearer picture of your needs. Let me provide some targeted recommendations with current market insights.`
  }

  private async findPerfectMatch(context: Partial<PropertyContext>): Promise<any> {
    // This would integrate with the vector database for semantic matching
    // For now, return a contextually relevant property
    const mockProperty = {
      id: "prop_001",
      address: context.location?.includes("victoria")
        ? "15 Akin Adesola Street, Victoria Island"
        : "Plot 123 Maitama District, Abuja",
      price: context.budget?.max || 8000000,
      bedrooms: context.bedrooms || 3,
      bathrooms: 2,
      size_sqft: 1800,
      propertyType: context.propertyType || "apartment",
      isVerified: true,
      verificationScore: 95,
      marketInsights: {
        pricePerSqft: 4444,
        marketTrend: "rising",
        neighborhoodScore: 9,
      },
    }

    return mockProperty
  }

  getConversationState(sessionId: string): ConversationState | null {
    return this.conversationStates.get(sessionId) || null
  }
}
