// api/tg-news-webhook.js
const { db } = require('./_firebase');

const SECRET = process.env.TG_NEWS_SECRET || '';
const ALLOWED = (process.env.TG_ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function parseTags(text) {
  const out = { client:'DEMO', stream:'main', lang:'uk', id:null, del:false, hide:false };
  const re = /#(\w+)(?:=([A-Za-z0-9_\-]+))?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1].toLowerCase();
    const val = (m[2] || '').trim();
    if (key === 'client' && val) out.client = val;
    else if (key === 'stream' && val) out.stream = val;
    else if (key === 'lang' && (val==='uk'||val==='en')) out.lang = val;
    else if (key === 'id' && val) out.id = val;
    else if (key === 'delete') out.del = true;
    else if (key === 'hide') out.hide = true;
  }
  const cleaned = text.replace(re, '').trim();
  return { meta: out, cleaned };
}

function pickPhoto(msg){
  // для channel_post/edited_channel_post фото у msg.photo (масив)
  const arr = msg.photo || [];
  if (!arr.length) return null;
  const best = arr[arr.length - 1]; // найбільше
  return { file_id: best.file_id, width: best.width, height: best.height };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'POST only' });
    if ((req.query.secret || '') !== SECRET) return res.status(403).json({ ok:false, error:'Bad secret' });

    const update = req.body || {};
    const msg = update.channel_post || update.edited_channel_post || update.message || update.edited_message;
    if (!msg || !msg.chat) return res.status(200).json({ ok:true, skip:'no message' });

    const chatId = String(msg.chat.id);
    if (!ALLOWED.includes(chatId)) return res.status(200).json({ ok:true, skip:'chat not allowed' });

    const text = (msg.caption || msg.text || '').trim();
    const { meta, cleaned } = parseTags(text);

    // title = перший рядок, body = решта
    const [firstLine, ...rest] = cleaned.split('\n');
    const title = firstLine?.trim() || '';
    const body  = rest.join('\n').trim();

    const photo = pickPhoto(msg);

    // ID документа
    const baseId = meta.id || `${msg.chat.id}_${msg.message_id}`;
    const docId  = `${meta.client}__${meta.stream}__${baseId}`;

    const payload = {
      client: meta.client,
      stream: meta.stream,
      lang: meta.lang,
      title,
      body,
      photo,            // {file_id,width,height} | null
      chatId: msg.chat.id,
      msgId: msg.message_id,
      ts: (msg.date || Math.floor(Date.now()/1000)) * 1000,
      editedTs: update.edited_channel_post ? Date.now() : null,
      hidden: meta.hide || false,
      deleted: meta.del || false,
    };

    await db.collection('news').doc(docId).set(payload, { merge: true });
    return res.status(200).json({ ok:true, id:docId, saved: true });
  } catch (e) {
    console.error('tg-news-webhook error', e);
    return res.status(500).json({ ok:false, error: e.message || String(e) });
  }
};
