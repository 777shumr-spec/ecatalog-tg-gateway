// api/news-list.js
const { db } = require('./_firebase');

module.exports = async (req, res) => {
  try {
    const client = (req.query.client || 'DEMO').toString();
    const stream = (req.query.stream || 'main').toString();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);

    const snap = await db
      .collection('news')
      .where('client', '==', client)
      .where('stream', '==', stream)
      .orderBy('ts', 'desc')   // поле з часовою міткою, Number/Firestore Timestamp
      .limit(limit)
      .get();

    const items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error('news-list error', e);
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
