// api/tg-order.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_IDS = (process.env.CHAT_IDS || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    const API_KEY = process.env.API_KEY || "";

    if (!BOT_TOKEN || CHAT_IDS.length === 0) {
      return res.status(500).json({ ok: false, error: "Missing BOT_TOKEN or CHAT_IDS" });
    }

    // проста авторизація (опційно)
    const headerKey = req.headers["x-api-key"];
    if (API_KEY && headerKey !== API_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // парсимо тіло (Unity може надіслати вже об’єкт, але підстрахуємось)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    if (!body || typeof body !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }

    const {
      orderId = "",
      customer = {},
      items = [],
      total = {},
      note = "",
      targetChatIds = []
    } = body;

    const chats = Array.isArray(targetChatIds) && targetChatIds.length
      ? targetChatIds
      : CHAT_IDS;

    // формуємо простий текст
    const fmtLine = (it, i) => {
      const lineTotal = Number(it.price) * Number(it.qty || 0);
      return `${i+1}. ${it.title} × ${it.qty} — ${lineTotal.toFixed(2)} ${it.currency}`;
    };

    const lines = [];
    lines.push(`🧾 Нове замовлення #${orderId}`);
    lines.push(`👤 ${customer.name || "-"}  📞 ${customer.phone || "-"}`);
    if (customer.email)   lines.push(`✉️ ${customer.email}`);
    if (customer.address) lines.push(`📍 ${customer.address}`);
    lines.push("");
    lines.push("Товари:");
    items.forEach((it, i) => lines.push(fmtLine(it, i)));
    lines.push("");
    if (total && total.amount != null && total.currency) {
      lines.push(`Разом (головна валюта): ${Number(total.amount).toFixed(2)} ${total.currency}`);
    }
    if (note) lines.push(`\n📝 ${note}`);

    const text = lines.join("\n").slice(0, 3900);

    const results = [];
    for (const chat_id of chats) {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, disable_web_page_preview: true })
      });
      const j = await r.json();
      results.push({ chat_id, ok: j.ok, desc: j.description || null });
    }

    const anyFail = results.some(r => !r.ok);
    res.status(anyFail ? 207 : 200).json({ ok: !anyFail, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Unexpected error" });
  }
}
