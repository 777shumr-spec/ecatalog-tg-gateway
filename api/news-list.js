// api/news-list.js
import { getDb } from './_firebase';

export default async function handler(req, res) {
  const { NEWS_API_SECRET } = process.env;
  if (NEWS_API_SECRET && req.headers['x-api-key'] !== NEWS_API_SECRET)
    return res.status(401).json({ ok: false, error: 'unauthorized' });

  const client = (req.query.client || 'default').toString();
  const stream = (req.query.stream || 'main').toString();
  const lang   = (req.query.lang || 'uk').toString();
  const since  = Number(req.query.since || 0);     // мс epoch
  const limit  = Math.min(Number(req.query.limit || 50), 200);

  const db = getDb();
  let q = db.collection('news').doc(client).collection('items')
    .where('stream', '==', stream)
    .where('lang', '==', lang)
    .where('deleted', '==', false)
    .orderBy('updatedAt', 'desc')
    .limit(limit);

  if (since > 0) q = q.where('updatedAt', '>', since);

  const snap = await q.get();
  const items = snap.docs.map(d => {
    const v = d.data();
    return {
      id: d.id,
      text: v.text,
      lang: v.lang,
      stream: v.stream,
      updatedAt: v.updatedAt,
      createdAt: v.createdAt || v.updatedAt,
      imageUrl: v.photo ? `/api/news-file?fid=${encodeURIComponent(v.photo.fileId)}` : null,
      imageWH: v.photo ? { w: v.photo.width, h: v.photo.height } : null,
    };
  });
  res.status(200).json({ ok: true, items, now: Date.now() });
}
