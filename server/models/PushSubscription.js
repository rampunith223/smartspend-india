import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    user_agent: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at' } },
);

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
