import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    _id: { type: String },
    user_id: { type: String, required: true, index: true },
    type: { type: String, enum: ['expense', 'income'], required: true, index: true },
    amount_paise: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    payment_method: { type: String, default: 'upi' },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default mongoose.model('Transaction', transactionSchema);
