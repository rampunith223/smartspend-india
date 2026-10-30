import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    category: { type: String, required: true },
    limit_paise: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default mongoose.model('Budget', budgetSchema);
