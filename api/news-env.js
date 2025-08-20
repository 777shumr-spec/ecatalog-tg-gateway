module.exports = (req, res) => {
  res.json({
    ok: true,
    allowed: (process.env.TG_ALLOWED_CHAT_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    hasToken: !!process.env.TG_BOT_TOKEN,
    hasSecret: !!process.env.TG_NEWS_SECRET
  });
};
