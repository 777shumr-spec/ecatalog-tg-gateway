// api/tg-file.js
const fetch = global.fetch;

const BOT = process.env.TG_BOT_TOKEN;

module.exports = async (req, res) => {
  try {
    const file_id = (req.query.file_id || '').toString();
    if (!file_id) return res.status(400).json({ ok:false, error:'file_id required' });

    // 1) getFile -> file_path
    const metaResp = await fetch(`https://api.telegram.org/bot${BOT}/getFile?file_id=${encodeURIComponent(file_id)}`);
    const meta = await metaResp.json();
    if (!meta.ok) return res.status(502).json({ ok:false, error: 'getFile failed' });

    const path = meta.result.file_path;
    const tgUrl = `https://api.telegram.org/file/bot${BOT}/${path}`;

    // 2) stream file back
    const imgResp = await fetch(tgUrl);
    if (!imgResp.ok) return res.status(502).json({ ok:false, error:'file fetch failed' });

    // пробросимо Content-Type і кеш
    const ct = imgResp.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 1 день
    const buf = Buffer.from(await imgResp.arrayBuffer());
    return res.status(200).end(buf);
  } catch (e) {
    console.error('tg-file error', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
};
