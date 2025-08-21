import Media from '../models/Media.js';
import { generateEmbedding } from './aiService.js';

// Fallback semantic search using naive cosine similarity if Atlas Vector Search is unavailable
function cosineSimilarity(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < len; i++) {
    const va = a[i] || 0;
    const vb = b[i] || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function semanticSearch(query, limit = 20) {
  const queryEmbedding = await generateEmbedding(query);

  // If using MongoDB Atlas Vector Search, prefer aggregation knnBeta
  // Detect availability by env flag
  if (process.env.USE_ATLAS_VECTOR_SEARCH === 'true') {
    try {
      const results = await Media.aggregate([
        {
          $search: {
            index: process.env.ATLAS_VECTOR_INDEX || 'mediaEmbeddingIndex',
            knnBeta: {
              vector: queryEmbedding,
              path: 'embedding',
              k: limit
            }
          }
        },
        { $limit: limit }
      ]).exec();
      return results;
    } catch (err) {
      // Fall through to local scoring
      console.warn('Atlas Vector Search failed, falling back to local similarity:', err?.message || err);
    }
  }

  // Fallback: compute cosine similarity in app layer
  const candidates = await Media.find({ embedding: { $exists: true, $ne: [] } })
    .limit(500) // safety cap
    .lean();
  const scored = candidates
    .map((doc) => ({ doc, score: cosineSimilarity(queryEmbedding, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ ...s.doc, _similarity: s.score }));
  return scored;
}


