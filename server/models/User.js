import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    monthly_income_paise: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    locale: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export default mongoose.model('User', userSchema);
