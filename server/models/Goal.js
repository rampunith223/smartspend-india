import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    target_paise: { type: Number, required: true, min: 1 },
    saved_paise: { type: Number, default: 0, min: 0 },
    monthly_target_paise: { type: Number, default: 0 },
    target_date: { type: String },
    color: { type: String, default: '#2B9966' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default mongoose.model('Goal', goalSchema);
