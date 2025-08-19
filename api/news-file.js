// api/news-file.js
export default async function handler(req, res) {
  const { TELEGRAM_BOT_TOKEN } = process.env;
  const fid = req.query.fid;
  if (!fid) return res.status(400).send('missing fid');

  // 1) дізнатися шлях файлу
  const gf = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fid)}`).then(r => r.json());
  if (!gf.ok) return res.status(404).send('file not found');
  const path = gf.result.file_path;

  // 2) віддати байти з кешуванням
  const tgUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${path}`;
  const resp = await fetch(tgUrl);
  if (!resp.ok) return res.status(502).send('tg fetch fail');

  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.setHeader('ETag', fid);
  res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
  const buf = Buffer.from(await resp.arrayBuffer());
  res.status(200).send(buf);
}
