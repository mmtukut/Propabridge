// Vector search implementation for semantic property matching
export interface PropertyVector {
  id: string
  embedding: number[]
  metadata: {
    address: string
    price: number
    bedrooms: number
    bathrooms: number
    size_sqft: number
    neighborhood_vibe: string
    market_sentiment: string
    safety_rating: number
    family_friendliness: number
    is_verified: boolean
  }
}

// Simple cosine similarity for demo (in production, use Pinecone/Weaviate)
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Mock embedding generation (in production, use OpenAI embeddings)
function generateMockEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(" ")
  const embedding = new Array(384).fill(0)

  // Simple hash-based embedding for demo
  words.forEach((word, index) => {
    const hash = word.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    embedding[Math.abs(hash) % 384] += 1
  })

  return embedding
}

export class VectorSearch {
  private propertyVectors: PropertyVector[] = []

  addProperty(property: any) {
    const searchText = `${property.address} ${property.neighborhood_vibe} ${property.market_sentiment} bedrooms:${property.bedrooms} bathrooms:${property.bathrooms}`
    const embedding = generateMockEmbedding(searchText)

    this.propertyVectors.push({
      id: property.id,
      embedding,
      metadata: property,
    })
  }

  async semanticSearch(query: string, limit = 5): Promise<any[]> {
    const queryEmbedding = generateMockEmbedding(query)

    const similarities = this.propertyVectors.map((pv) => ({
      property: pv.metadata,
      similarity: cosineSimilarity(queryEmbedding, pv.embedding),
    }))

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.property)
  }
}
