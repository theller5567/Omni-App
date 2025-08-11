import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Find media with mediaType stored as a string using raw collection to bypass schema casting
  const batchSize = 500;
  let migrated = 0;
  let skipped = 0;

  // Helper: case-insensitive exact name match
  const exactNameCi = (name) => new RegExp(`^${String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  const rawCursor = Media.collection.find({ mediaType: { $type: 'string' } });
  while (await rawCursor.hasNext()) {
    const rawDoc = await rawCursor.next();
    try {
      // Prefer explicit string in mediaType; fallbacks if needed
      const name = rawDoc.mediaType || rawDoc.mediaTypeName || rawDoc?.metadata?.mediaTypeName;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        console.warn(`No usable media type name on doc ${rawDoc._id}, skipping`);
        skipped++;
        continue;
      }

      // Find MediaType by case-insensitive exact match
      const mt = await MediaType.findOne({ name: exactNameCi(name.trim()) }).lean();
      if (!mt) {
        console.warn(`No MediaType found for name '${name}', skipping doc ${rawDoc._id}`);
        skipped++;
        continue;
      }

      await Media.collection.updateOne({ _id: rawDoc._id }, { $set: { mediaType: mt._id } });
      migrated++;
      if (migrated % batchSize === 0) {
        console.log(`Migrated ${migrated} documents...`);
      }
    } catch (e) {
      console.warn('Migration error for doc', String(rawDoc._id), e?.message || e);
      skipped++;
    }
  }

  console.log(`Migration complete. Migrated=${migrated}, Skipped=${skipped}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Migration failed', e);
  process.exit(1);
});


