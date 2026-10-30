import { Router } from 'express';
import { requireAuth } from '../auth.js';
import PushSubscription from '../models/PushSubscription.js';
import { ApiError, asyncHandler, parseBody } from '../lib/http.js';
import {
  getVapidPublicKey,
  pushConfigured,
  removeSubscription,
  saveSubscription,
  sendPushToUser,
} from '../lib/push.js';
import { z } from 'zod';

const router = Router();
router.use(requireAuth);

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1024),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256),
  }),
});

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json({ configured: pushConfigured, publicKey: getVapidPublicKey() });
  }),
);

router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    if (!pushConfigured)
      throw new ApiError(503, 'Push notifications are not configured on this server.');
    const input = parseBody(subscriptionSchema, req.body);
    await saveSubscription(req.user.id, input, req.headers['user-agent'] || '');
    res.status(201).json({ ok: true });
  }),
);

router.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const input = parseBody(subscriptionSchema.pick({ endpoint: true }), req.body);
    await removeSubscription(req.user.id, input.endpoint);
    res.json({ ok: true });
  }),
);

router.post(
  '/test',
  asyncHandler(async (req, res) => {
    if (!pushConfigured)
      throw new ApiError(503, 'Push notifications are not configured on this server.');
    const sent = await sendPushToUser(req.user.id, {
      title: 'SmartSpend test notification',
      body: 'Your phone is connected. Savings alarms will reach you here.',
      url: '/app',
      tag: 'test',
    });
    if (!sent) {
      throw new ApiError(400, 'No device is subscribed yet. Enable notifications on your phone first.');
    }
    res.json({ ok: true, sent });
  }),
);

export default router;
