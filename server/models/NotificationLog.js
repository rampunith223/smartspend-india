import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    kind: { type: String, required: true },
    day: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at' } },
);

export default mongoose.model('NotificationLog', notificationLogSchema);
