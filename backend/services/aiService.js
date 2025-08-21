import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

let openai = null;
if (apiKey) {
  openai = new OpenAI({ apiKey });
}

export async function ensureOpenAIConfigured() {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
}

export async function generateEmbedding(text) {
  await ensureOpenAIConfigured();
  const input = (text || '').slice(0, 8000);
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input
  });
  return res.data[0]?.embedding || [];
}

export async function describeAndTagImageByUrl(url) {
  await ensureOpenAIConfigured();
  const system = 'You help organize a media library. Return strict JSON with: tags (<=8 short nouns), description (<=40 words), altText (<=16 words).';
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this image and produce JSON.' },
          { type: 'image_url', image_url: { url } }
        ]
      }
    ]
  });
  try {
    return JSON.parse(res.choices[0]?.message?.content || '{}');
  } catch {
    return { tags: [], description: '', altText: '' };
  }
}


