// Vercel Serverless Function for Notion API Proxy
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_API_URL = 'https://api.notion.com/v1';

  // URL 경로 추출 (/api/notion/databases/xxx -> /databases/xxx)
  const { path } = req.query;
  const notionPath = Array.isArray(path) ? '/' + path.join('/') : '/' + path;
  const url = `${NOTION_API_URL}${notionPath}`;

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
}
