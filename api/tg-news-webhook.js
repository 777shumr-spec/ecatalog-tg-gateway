// api/tg-news-webhook.js
import { getDb } from './_firebase';

const ok = (res) => res.status(200).json({ ok: true });
const bad = (res, msg) => res.status(400).json({ ok: false, error: msg });

function pickMsg(update) {
  return update.message || update.channel_post || update.edited_message || update.edited_channel_post;
}
function parseTags(txt = '') {
  // приклад тегів: #client=ACME #stream=main #lang=uk
  const client = (txt.match(/#client=([a-zA-Z0-9_\-]+)/) || [])[1] || 'default';
  const stream = (txt.match(/#stream=([a-zA-Z0-9_\-]+)/) || [])[1] || 'main';
  const lang   = (txt.match(/#lang=(uk|en)/) || [])[1] || 'uk';
  return { client, stream, lang };
}
function largestPhoto(photos = []) {
  if (!photos.length) return null;
  return photos.reduce((a, b) => (a.file_size || 0) > (b.file_size || 0) ? a : b);
}

export default async function handler(req, res) {
  const { TG_WEBHOOK_SECRET, TG_ALLOWED_CHAT_IDS } = process.env;
  if (req.query.secret !== TG_WEBHOOK_SECRET) return bad(res, 'secret mismatch');

  const allowed = new Set((TG_ALLOWED_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
  const update = req.body;

  const msg = pickMsg(update);
  if (!msg) return ok(res);

  const chatId = String(msg.chat?.id || '');
  if (allowed.size && !allowed.has(chatId)) return ok(res); // ігноруємо чужі чати

  const db = getDb();
  const now = Date.now();

  // /del як відповідь на пост → помітити видаленим
  if ((msg.text || '').startsWith('/del') && msg.reply_to_message) {
    const rid = msg.reply_to_message.message_id;
    const qs = await db.collectionGroup('items')
      .where('source.chatId', '==', chatId)
      .where('source.messageId', '==', rid).get();
    const batch = db.batch();
    qs.forEach(doc => batch.update(doc.ref, { deleted: true, updatedAt: now }));
    await batch.commit();
    return ok(res);
  }

  // новий/редагований пост
  const text = (msg.caption || msg.text || '').trim();
  const { client, stream, lang } = parseTags(text);

  // контент
  let photo = null;
  if (msg.photo) {
    const p = largestPhoto(msg.photo);
    photo = {
      fileId: p.file_id,
      uniqueId: p.file_unique_id,
      width: p.width,
      height: p.height,
    };
  }

  const docId = `${chatId}_${msg.message_id}`;
  const ref = db.collection('news').doc(client).collection('items').doc(docId);

  const payload = {
    client, stream, lang,
    text,
    photo,                 // null якщо немає
    source: { chatId, messageId: msg.message_id },
    deleted: false,
    updatedAt: now,
  };

  const snap = await ref.get();
  if (snap.exists) {
    await ref.update(payload);
  } else {
    payload.createdAt = now;
    await ref.set(payload);
  }
  return ok(res);
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };
