const express = require('express');
const fs = require('fs');
require('dotenv').config();
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

const PROVIDER = 'openai';
const MODEL = 'gpt-4o-mini';
const basePrompt = fs.readFileSync('prompt.md','utf8');

const PERSONAS={
  friendly:"あなたはとても優しく、友達のようなAIです。共感を重視し、安心させる言葉を多く使ってください。",
  strict:"あなたは少し厳しいが的確なアドバイスをするAIです。甘やかさず、改善点をはっきり伝えてください。",
  counselor:"あなたはカウンセラーAIです。質問を交えながら、ユーザーの考えを深めてください。"
};

/* ===== MBTI診断用API ===== */
app.post('/api/',async(req,res)=>{
  try{
    const {prompt}=req.body;
    const systemPrompt = basePrompt;
    const finalPrompt=`【ユーザーの回答】\n${prompt}`;
    const result=await callOpenAI(systemPrompt,finalPrompt);
    res.json({data:result});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

async function callOpenAI(systemPrompt,userPrompt){
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch(
    'https://openai-api-proxy-746164391621.us-west1.run.app',
    {method:'POST',
     headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},
     body:JSON.stringify({model:MODEL,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}],response_format:{type:'json_object'}})
    });
  const data=await response.json();
  return JSON.parse(data.choices[0].message.content);
}

/* ===== Socket.IO チャット ===== */
io.on('connection',socket=>{
  socket.on('user connected',id=>{
    socket.clientId=id;
    socket.emit('welcome',id);
  });

  socket.on('chat message',async data=>{
    // AIが返信する
    const {id,msg,persona,mbti}=data;
    // broadcast user msg
    io.emit('chat message',{id,msg});

    // AI生成
    const systemPrompt=basePrompt + "\n\n" + (PERSONAS[persona]||PERSONAS.friendly);
    const userPrompt=`MBTI:${mbti}\nユーザー発言:${msg}\nAIとして返答してください。`;
    const aiData=await callOpenAI(systemPrompt,userPrompt);
    io.emit('chat message',{id:'AI-'+persona,msg:aiData.description||aiData.advice||'はい'});
  });

  socket.on('disconnect',()=>{
    if(socket.clientId) io.emit('user left',socket.clientId);
  });
});

server.listen(8080,()=>console.log("Server running on http://localhost:8080"));




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