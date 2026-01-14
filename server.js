const express = require('express');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static('public'));

// ===============================
// 設定
// ===============================
const MODEL = 'gpt-4o-mini';
const OPENAI_API_ENDPOINT =
  'https://openai-api-proxy-746164391621.us-west1.run.app';

// ===============================
// prompt.md 読み込み
// ===============================
const systemPrompt = fs.readFileSync('prompt.md', 'utf8');

// ===============================
// API
// ===============================
app.post('/api/', async (req, res) => {
  try {
    const { answers } = req.body;

    const response = await fetch(OPENAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(answers) }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 500
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    res.json(result);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===============================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


// import express from "express";
// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";

// const app = express();
// const PORT = 3000;

// app.use(express.json());
// app.use(express.static("public"));

// // system prompt（prompt.mdを読む）
// const systemPrompt = fs.readFileSync("prompt.md", "utf-8");

// // メモリ上で会話履歴を保持（※学習用ならOK）
// let messages = [
//   {
//     role: "system",
//     content: systemPrompt
//   }
// ];

// app.post("/chat", async (req, res) => {
//   const userMessage = req.body.message;

//   // ユーザー発言を履歴に追加
//   messages.push({
//     role: "user",
//     content: userMessage
//   });
  

//   try {
//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
//       },
//       body: JSON.stringify({
//         model: "gpt-4o-mini",
//         messages: messages,
//         temperature: 0.7
//       })
//     });

//     const data = await response.json();
//     const aiMessage = data.choices[0].message.content;

//     // AI発言を履歴に追加
//     messages.push({
//       role: "assistant",
//       content: aiMessage
//     });

//     res.json({ reply: aiMessage });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "LLMエラーが発生しました" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


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