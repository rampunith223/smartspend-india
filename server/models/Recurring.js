import mongoose from 'mongoose';

const recurringSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    amount_paise: { type: Number, required: true, min: 1 },
    category: { type: String, required: true },
    frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
    next_due_date: { type: String, required: true, index: true },
    notes: { type: String, default: '' },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default mongoose.model('Recurring', recurringSchema);
