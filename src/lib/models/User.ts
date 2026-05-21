import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    isActive: { type: Boolean, default: false },
    passwordResetToken: { type: String, default: null, index: true },
    passwordResetExpiry: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ roles: 1, isActive: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
