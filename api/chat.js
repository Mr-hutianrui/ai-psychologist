// api/chat.js
// Vercel Serverless function: 将前端的 messages 转发到 OpenAI Chat Completions
// 注意：需要在 Vercel 环境变量里配置 OPENAI_API_KEY

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set in environment' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    // 调用 OpenAI Chat Completions API
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',       // 你可以替换为其他模型
        messages,
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      // 将 OpenAI 返回的错误原样返回（并在 Vercel 日志中打印）
      console.error('OpenAI error:', text);
      let parsed;
      try { parsed = JSON.parse(text); } catch (e) { parsed = text; }
      return res.status(resp.status).json({ error: parsed });
    }

    // 成功：把 OpenAI 的 JSON 直接返回给前端
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error in /api/chat:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
