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
        max_completion_tokens: 200
      })
    });

    const data = await response.json();
    const mood = JSON.parse(data.choices[0].message.content).mood;

    // ===============================
    // 気分 → 花パラメータ変換
    // ===============================
    let flower;

    if (mood === 'positive') {
      flower = {
        petalCount: 7 + Math.floor(Math.random() * 2),
        color: { r: 255, g: 180, b: 210 }
      };
    } else if (mood === 'flat') {
      flower = {
        petalCount: 5 + Math.floor(Math.random() * 2),
        color: { r: 245, g: 200, b: 150 }
      };
    } else {
      flower = {
        petalCount: 3 + Math.floor(Math.random() * 2),
        color: { r: 200, g: 170, b: 220 }
      };
    }

    res.json({ flower, mood });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ===============================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});