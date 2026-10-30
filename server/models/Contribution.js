import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema(
  {
    _id: { type: String },
    goal_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    amount_paise: { type: Number, required: true, min: 1 },
    date: { type: String, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at' } },
);

export default mongoose.model('Contribution', contributionSchema);
