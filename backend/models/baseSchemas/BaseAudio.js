import mongoose from 'mongoose';
import Media from '../Media.js';

// Base schema for all Audio type media
const baseAudioSchema = new mongoose.Schema({
  // Audio-specific fields
  metadata: {
    duration: { type: Number }, // in seconds
    sampleRate: { type: Number },
    channels: { type: Number },
    bitRate: { type: Number },
    codec: { type: String },
    artist: { type: String },
    album: { type: String },
    genre: { type: String },
    trackNumber: { type: Number },
  }
});

const BaseAudio = Media.discriminator('BaseAudio', baseAudioSchema);

export default BaseAudio; 