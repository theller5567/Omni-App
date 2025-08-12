import mongoose from 'mongoose';

const sendgridEventSchema = new mongoose.Schema(
  {
    event: { type: String, index: true },
    email: { type: String, index: true },
    timestamp: { type: Number, index: true },
    smtp_id: String,
    sg_event_id: String,
    sg_message_id: String,
    reason: String,
    response: String,
    status: String,
    url: String,
    ip: String,
    useragent: String,
    category: mongoose.Schema.Types.Mixed,
    // store full raw payload for future reference
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.SendgridEvent ||
  mongoose.model('SendgridEvent', sendgridEventSchema);


