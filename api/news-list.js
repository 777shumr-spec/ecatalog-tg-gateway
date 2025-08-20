// api/news-list.js
const { db } = require('./_firebase');

function mapNews(d, id) {
  return {
    id,
    client: d.client,
    stream: d.stream,
    lang: d.lang || 'uk',
    title: d.title || '',
    body: d.body || '',
    photo: d.photo || null, // {file_id,width,height}
    ts: d.ts || Date.now(),
    hidden: !!d.hidden,
    deleted: !!d.deleted
  };
}

module.exports = async (req, res) => {
  try {
    const client = String(req.query.client || '').trim();
    const stream = String(req.query.stream || '').trim();
    const lang   = (req.query.lang || '').trim(); // опційно

    if (!client || !stream) {
      return res.status(400).json({ ok:false, error:'Missing client/stream' });
    }

    // Мінімум where => індекси не потрібні
    const snap = await db.collection('news')
      .where('client', '==', client)
      .where('stream', '==', stream)
      .orderBy('ts', 'desc')
      .limit(50)
      .get();

    const items = [];
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (d.deleted) return;
      if (d.hidden)  return;
      if (lang && d.lang && d.lang !== lang) return;
      items.push(mapNews(d, doc.id));
    });

    return res.status(200).json({ ok:true, items });
  } catch (e) {
    console.error('news-list error', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
};
