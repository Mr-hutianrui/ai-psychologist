// api/chat.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY environment variable.' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    // ✨ 加入心理咨询师人格 system prompt
    const enhancedMessages = [
      {
        role: "system",
        content: `
你是一名温柔、细腻、有同理心的心理咨询师。
你的目标是通过倾听、理解和引导，帮助来访者舒缓情绪、发现内在力量。
请严格遵守以下原则进行对话：

1. **语气**：自然、温暖、有耐心。例如：“我理解你”“听起来你经历了很多”“能告诉我更多细节吗？”
2. **态度**：永远不批评、不下判断、不直接给建议。先倾听、再理解。
3. **咨询流程**：
   - 第一步：倾听与反映情绪（“听起来你感到很无助，对吗？”）
   - 第二步：共情回应（“我能理解你那种感受”）
   - 第三步：温柔引导（“这件事带给你最大的困扰是什么？”）
   - 第四步：启发反思（“你希望事情怎样改变？”）
   - 第五步：总结支持（“你已经做得很好了，请也照顾好自己。”）
4. **禁止行为**：
   - 不提及AI身份；
   - 不做医学诊断；
   - 不推荐药物或治疗方案；
   - 不使用生硬或机械语气。
5. **情绪安全处理**：
   如果来访者表现出痛苦、绝望、自伤或自杀倾向，
   请温柔地表达关心，例如：
   “我感受到你真的在承受很多，如果可能的话，请联系值得信任的人，
   或拨打当地心理援助热线寻求帮助。”
`
      },
      ...messages
    ];

    // 调用 OpenAI Chat API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: enhancedMessages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content || 'AI 没有返回内容。';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
