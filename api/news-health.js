// api/news-health.js
import { getDb } from './_firebase';

export default async function handler(req, res) {
  try {
    const db = getDb();
    await db.collection('_health').doc('ping').set({ ts: Date.now() }, { merge: true });
    return res.status(200).json({ ok: true, name: 'eCatalog News backend' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
