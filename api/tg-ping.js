export default async function handler(req, res) {
  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_IDS = (process.env.CHAT_IDS || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const text = (req.query.text || "Ping from eCatalog").toString();

    if (!BOT_TOKEN || CHAT_IDS.length === 0) {
      return res.status(500).json({ ok: false, error: "Missing BOT_TOKEN or CHAT_IDS" });
    }

    const results = [];
    for (const chat_id of CHAT_IDS) {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text })
      });
      const j = await r.json();
      results.push({ chat_id, ok: j.ok, desc: j.description || null });
    }
    res.status(200).json({ ok: results.every(r => r.ok), results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Unexpected error" });
  }
}
