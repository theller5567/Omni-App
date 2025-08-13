/*
  Ensure S3 object keys used in Media documents have a proper file extension.
  - For any Media.location (and metadata.v_thumbnail) lacking an extension in the path,
    detect extension from media.fileExtension or the S3 object's Content-Type,
    copy the object to a new key with .ext appended, and update the DB URL.
  - Leaves original objects in place (safer). You can remove them later if desired.
*/
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import AWS from 'aws-sdk';
import Media from '../models/Media.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

const BUCKET = process.env.AWS_BUCKET || process.env.S3_BUCKET || 'omnimedialibrarybucket';

const hasExtension = (keyOrUrl) => {
  try {
    const p = keyOrUrl.split('?')[0];
    return /\.[a-zA-Z0-9]{2,5}$/.test(p);
  } catch { return false; }
};

const urlToKey = (url) => {
  try {
    // Expect https://<bucket>.s3.<region>.amazonaws.com/<key>
    const u = new URL(url);
    return decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
};

const contentTypeToExt = (ct) => {
  if (!ct) return null;
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };
  return map[ct] || null;
};

const buildUrl = (key) => `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${encodeURIComponent(key)}`;

async function ensureObjectWithExtension(key, extHint) {
  if (!key || hasExtension(key)) return { key, changed: false };

  // Head object to get content-type if needed
  let ext = (extHint || '').replace(/^\./, '').toLowerCase();
  if (!ext) {
    try {
      const head = await s3.headObject({ Bucket: BUCKET, Key: key }).promise();
      ext = contentTypeToExt(head.ContentType) || '';
    } catch (e) {
      console.error('headObject failed for', key, e.code || e.message);
    }
  }
  if (!ext) {
    // default to png for thumbnails if we absolutely must
    ext = 'png';
  }

  const newKey = `${key}.${ext}`;
  try {
    // Check if new key already exists
    await s3.headObject({ Bucket: BUCKET, Key: newKey }).promise().catch(() => null);
  } catch {
    // no-op
  }

  // Copy old -> new (idempotent if exists)
  try {
    await s3.copyObject({
      Bucket: BUCKET,
      CopySource: `/${BUCKET}/${encodeURIComponent(key)}`,
      Key: newKey,
      ACL: 'public-read',
      ContentType: undefined, // Let S3 keep original; serves fine via key ext
    }).promise();
    return { key: newKey, changed: true };
  } catch (e) {
    console.error('copyObject failed for', key, '->', newKey, e.code || e.message);
    return { key, changed: false };
  }
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const cursor = Media.find({}).cursor();
  let processed = 0, updated = 0, skipped = 0, copied = 0;

  for await (const doc of cursor) {
    processed += 1;
    let changed = false;
    const updates = {};

    // location
    if (doc.location && !hasExtension(doc.location)) {
      const key = urlToKey(doc.location);
      if (key) {
        const { key: newKey, changed: c } = await ensureObjectWithExtension(key, (doc.fileExtension || '').toLowerCase());
        if (c) copied += 1;
        if (newKey !== key) {
          updates.location = buildUrl(newKey);
          changed = true;
        }
      } else {
        skipped += 1;
      }
    }

    // thumbnail
    const vthumb = doc.metadata?.v_thumbnail;
    if (vthumb && typeof vthumb === 'string' && !hasExtension(vthumb)) {
      const key = urlToKey(vthumb);
      if (key) {
        const { key: newKey, changed: c } = await ensureObjectWithExtension(key, 'png');
        if (c) copied += 1;
        if (newKey !== key) {
          updates['metadata.v_thumbnail'] = buildUrl(newKey);
          changed = true;
        }
      } else {
        skipped += 1;
      }
    }

    if (changed) {
      await Media.updateOne({ _id: doc._id }, { $set: updates }).exec();
      updated += 1;
      console.log('Updated media', String(doc._id), updates);
    }
  }

  console.log('Done.', { processed, updated, copied, skipped });
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Script error', e);
  process.exit(1);
});


