// api/tg-file.js
'use strict';

const BOT = process.env.BOT_TOKEN;
if (!BOT) console.warn('BOT_TOKEN is missing');

module.exports = async (req, res) => {
  try {
    const fileId = (req.query.file_id || '').trim();
    if (!fileId) return res.status(400).json({ ok:false, error: 'file_id required' });
    if (!BOT)     return res.status(500).json({ ok:false, error: 'BOT_TOKEN missing' });

    // 1) getFile -> file_path
    const metaResp = await fetch(`https://api.telegram.org/bot${BOT}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const metaJson = await metaResp.json();
    if (!metaJson.ok || !metaJson.result || !metaJson.result.file_path) {
      return res.status(404).json({ ok:false, error:'file not found for file_id' });
    }
    const filePath = metaJson.result.file_path;

    // 2) download file
    const fileUrl = `https://api.telegram.org/file/bot${BOT}/${filePath}`;
    const binResp = await fetch(fileUrl);
    if (!binResp.ok) return res.status(404).json({ ok:false, error:'download failed' });

    const buf = Buffer.from(await binResp.arrayBuffer());
    const ct  = binResp.headers.get('content-type') || 'application/octet-stream';

    // Телеграмні файли незмінні — ставимо довгий кеш
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    return res.status(200).end(buf);
  } catch (e) {
    console.error('tg-file error', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
};
