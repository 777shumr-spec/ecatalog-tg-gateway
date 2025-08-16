export default function handler(req, res) {
  res.status(200).json({
    hasToken: !!process.env.BOT_TOKEN,
    hasChats: !!process.env.CHAT_IDS,
    env: process.env.VERCEL_ENV || "unknown"
  });
}
