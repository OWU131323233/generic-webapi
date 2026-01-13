// server.js
const express = require('express');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const fetch = require('node-fetch'); // Node.js 18未満の場合必要

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// ===============================
// 設定
// ===============================
const PROVIDER = 'openai';
const MODEL = 'gpt-4o-mini';

// ===============================
// prompt.md 読み込み（MBTI診断用）
// ===============================
const basePrompt = fs.readFileSync('prompt.md', 'utf8');

// ===============================
// AIキャラ定義（multiple-ai-chat用）
// ===============================
const PERSONAS = {
  normal: `
あなたは丁寧で分かりやすいAIです。
ユーザーの話を整理し、前向きな回答をしてください。
`,
  friendly: `
あなたはとても優しく、友達のようなAIです。
共感を重視し、安心させる言葉を多く使ってください。
`,
  strict: `
あなたは少し厳しいが的確なアドバイスをするAIです。
甘やかさず、改善点をはっきり伝えてください。
`,
  counselor: `
あなたはカウンセラーAIです。
質問を交えながら、ユーザーの考えを深めてください。
`
};

// ===============================
// ミドルウェア
// ===============================
app.use(express.json());
app.use(express.static('public'));

// ===============================
// MBTI診断用 API
// ===============================
app.post('/api/', async (req, res) => {
  try {
    const { prompt, persona = 'normal' } = req.body;

    const systemPrompt = basePrompt + '\n\n' + (PERSONAS[persona] || PERSONAS.normal);

    const finalPrompt = `【ユーザーの入力】\n${prompt}`;

    const result = await callOpenAI(systemPrompt, finalPrompt);

    res.json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// OpenAI 呼び出し関数
// ===============================
async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch(
    'https://openai-api-proxy-746164391621.us-west1.run.app',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    }
  );

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// ===============================
// Socket.IO チャット機能
// ===============================
io.on('connection', (socket) => {
  console.log('A user connected');

  // クライアントが接続時に送るIDを保持
  socket.on('user connected', (clientId) => {
    socket.clientId = clientId;
    console.log(`${clientId} connected`);

    // 接続したクライアントに挨拶
    socket.emit('welcome', clientId);

    // 他クライアントに参加通知
    socket.broadcast.emit('user joined', clientId);
  });

  // クライアント切断
  socket.on('disconnect', () => {
    if (socket.clientId) {
      console.log(`${socket.clientId} disconnected`);
      io.emit('user left', socket.clientId);
    }
  });

  // チャットメッセージ受信
  socket.on('chat message', async (msg) => {
    // まず全員に送信
    io.emit('chat message', msg);

    // AIからの返信かどうか判断（IDが AI- で始まる場合）
    if (msg.id.startsWith('AI-')) {
      // 再帰的なAI返信は任意で制御可能
      return;
    }

    // ここでAI応答生成も可能
    // 例：AIキャラクターに応じて応答を生成する
    if (msg.aiPersona) {
      try {
        const systemPrompt = PERSONAS[msg.aiPersona] || PERSONAS.normal;
        const userPrompt = msg.msg;

        const aiResult = await callOpenAI(systemPrompt, userPrompt);

        const aiMsg = {
          id: 'AI-' + Math.random().toString(36).substring(2, 10),
          msg: aiResult.description || aiResult.advice || 'わかりません'
        };

        io.emit('chat message', aiMsg);
      } catch (err) {
        console.error('AI返信生成エラー', err);
      }
    }
  });
});

// ===============================
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


// const express = require('express');
// const fs = require('fs');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 8080;

// app.use(express.json());
// app.use(express.static('public'));

// // ===============================
// // 設定
// // ===============================
// const PROVIDER = 'openai';
// const MODEL = 'gpt-4o-mini';

// // ===============================
// // prompt.md 読み込み
// // ===============================
// let systemPrompt;
// try {
//   systemPrompt = fs.readFileSync('prompt.md', 'utf8');
// } catch (error) {
//   console.error('Error reading prompt.md:', error);
//   process.exit(1);
// }

// // ===============================
// // OpenAI API
// // ===============================
// const OPENAI_API_ENDPOINT =
//   'https://openai-api-proxy-746164391621.us-west1.run.app';

// // ===============================
// // API
// // ===============================
// app.post('/api/', async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ error: 'Prompt is required' });
//     }

//     const result = await callOpenAI(systemPrompt, prompt);

//     res.json({
//       data: result
//     });

//   } catch (error) {
//     console.error('API Error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // ===============================
// // OpenAI 呼び出し
// // ===============================
// async function callOpenAI(systemPrompt, userPrompt) {
//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     throw new Error('OPENAI_API_KEY is not set');
//   }

//   const response = await fetch(OPENAI_API_ENDPOINT, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${apiKey}`
//     },
//     body: JSON.stringify({
//       model: MODEL,
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt }
//       ],
//       response_format: { type: 'json_object' },
//       max_completion_tokens: 1000
//     })
//   });

//   if (!response.ok) {
//     const err = await response.text();
//     throw new Error('OpenAI API error: ' + err);
//   }

//   const data = await response.json();
//   const text = data.choices[0].message.content;

//   try {
//     return JSON.parse(text);
//   } catch {
//     throw new Error('Failed to parse JSON from LLM');
//   }
// }

// // ===============================
// // サーバ起動
// // ===============================
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });