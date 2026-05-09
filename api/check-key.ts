export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  res.status(200).json({
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    prefix: apiKey ? apiKey.substring(0, 4) + "****" : "none",
    env: process.env.NODE_ENV
  });
}
