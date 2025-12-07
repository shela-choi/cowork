// 간단한 프록시 서버 (Notion API CORS 우회용)
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// 환경변수 로드
import { config } from 'dotenv';
config();

const NOTION_API_KEY = process.env.VITE_NOTION_API_KEY;
const NOTION_API_URL = 'https://api.notion.com/v1';

app.use(cors());
app.use(express.json());

// Notion API 프록시 - Express 4 문법
app.use('/notion', async (req, res) => {
  const path = req.url; // /notion 이후의 경로
  const url = `${NOTION_API_URL}${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Notion API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`프록시 서버 실행 중: http://localhost:${PORT}`);
});
