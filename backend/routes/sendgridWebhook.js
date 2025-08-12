import express from 'express';
import SendgridEvent from '../models/SendgridEvent.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// Receive SendGrid event webhooks (batched array)
router.post('/sendgrid', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [];
    if (events.length === 0) {
      return res.status(200).send('no-events');
    }

    // Persist a minimal subset and raw payload per event
    const docs = events.map((e) => ({
      event: e.event,
      email: e.email,
      timestamp: e.timestamp,
      smtp_id: e.smtp_id,
      sg_event_id: e.sg_event_id,
      sg_message_id: e.sg_message_id,
      reason: e.reason,
      response: e.response,
      status: e.status,
      url: e.url,
      ip: e.ip,
      useragent: e.useragent,
      category: e.category,
      raw: e,
    }));
    await SendgridEvent.insertMany(docs, { ordered: false });

    // Basic console log for quick visibility
    events.forEach((e) => {
      console.log('[SendGrid]', e.event, e.email, e.reason || e.response || '');
    });

    res.status(200).send('ok');
  } catch (err) {
    console.error('SendGrid webhook error:', err);
    res.status(500).send('error');
  }
});

export default router;

// Admin-only: fetch recent events
router.get(
  '/sendgrid/recent',
  authenticate,
  authorize(['superAdmin', 'admin']),
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
      const events = await SendgridEvent.find({})
        .sort({ createdAt: -1 })
        .limit(limit);
      res.status(200).json(events);
    } catch (err) {
      console.error('SendGrid recent events error:', err);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  }
);


