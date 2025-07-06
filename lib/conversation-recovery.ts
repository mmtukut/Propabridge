// Enhanced conversation flows with graceful recovery
export interface ConversationContext {
  userId: string
  sessionId: string
  currentIntent: string
  preferences: {
    budget?: { min: number; max: number }
    bedrooms?: number
    location?: string
    lifestyle?: string[]
  }
  conversationHistory: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: string
    intent?: string
  }>
  recoveryAttempts: number
}

export class ConversationRecovery {
  private contexts: Map<string, ConversationContext> = new Map()

  updateContext(sessionId: string, update: Partial<ConversationContext>) {
    const existing = this.contexts.get(sessionId) || {
      userId: "anonymous",
      sessionId,
      currentIntent: "property_search",
      preferences: {},
      conversationHistory: [],
      recoveryAttempts: 0,
    }

    this.contexts.set(sessionId, { ...existing, ...update })
  }

  getContext(sessionId: string): ConversationContext | null {
    return this.contexts.get(sessionId) || null
  }

  detectConfusion(userMessage: string): boolean {
    const confusionIndicators = [
      "i don't understand",
      "what do you mean",
      "confused",
      "not sure",
      "can you explain",
      "help me",
      "i'm lost",
    ]

    return confusionIndicators.some((indicator) => userMessage.toLowerCase().includes(indicator))
  }

  generateRecoveryResponse(context: ConversationContext): string {
    const { recoveryAttempts, preferences, currentIntent } = context

    if (recoveryAttempts === 0) {
      return `I understand you might need some clarification! Let me help you step by step. 

What I can help you with:
🏠 **Find Properties** - Tell me your budget, preferred area, or lifestyle
🔍 **Property Details** - Get detailed info about specific properties  
📞 **Connect with Owners** - Arrange viewings or discussions
✅ **Verify Properties** - Check blockchain verification status

What would you like to focus on first?`
    } else if (recoveryAttempts === 1) {
      return `Let me try a different approach! Here are some simple questions to get started:

1. **Budget**: What's your price range? (e.g., "under 2 million")
2. **Location**: Any preferred areas? (e.g., "near the beach", "downtown")  
3. **Size**: How many bedrooms do you need?
4. **Lifestyle**: What's important to you? (e.g., "family-friendly", "nightlife")

Just answer any one of these to get started!`
    } else {
      return `I want to make sure I'm helping you effectively! Would you prefer to:

🎯 **Start Fresh** - Begin with a simple property search
📞 **Talk to Human** - Connect with our property specialist
📧 **Get Examples** - See sample properties to understand our service

Just let me know what works best for you!`
    }
  }

  extractPreferences(userMessage: string): Partial<ConversationContext["preferences"]> {
    const preferences: Partial<ConversationContext["preferences"]> = {}

    // Budget extraction
    const budgetMatch = userMessage.match(/(\$?[\d,]+(?:\.\d+)?)\s*(?:million|k|thousand)?/gi)
    if (budgetMatch) {
      const amount = Number.parseFloat(budgetMatch[0].replace(/[$,]/g, ""))
      if (userMessage.includes("million")) {
        preferences.budget = { max: amount * 1000000 }
      } else if (userMessage.includes("k") || userMessage.includes("thousand")) {
        preferences.budget = { max: amount * 1000 }
      }
    }

    // Bedroom extraction
    const bedroomMatch = userMessage.match(/(\d+)\s*(?:bed|bedroom)/i)
    if (bedroomMatch) {
      preferences.bedrooms = Number.parseInt(bedroomMatch[1])
    }

    // Location extraction
    const locationKeywords = ["beach", "downtown", "suburb", "city", "hills", "park"]
    const foundLocations = locationKeywords.filter((keyword) => userMessage.toLowerCase().includes(keyword))
    if (foundLocations.length > 0) {
      preferences.location = foundLocations[0]
    }

    return preferences
  }
}
