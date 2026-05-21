import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  expiryDate: { type: Date, required: true, index: true },
});

RefreshTokenSchema.statics.createToken = async function (user: { _id: mongoose.Types.ObjectId }) {
  const expiredAt = new Date();
  expiredAt.setSeconds(expiredAt.getSeconds() + 86400);

  const _token = uuidv4();
  const _object = new this({
    token: _token,
    user: user._id,
    expiryDate: expiredAt,
  });

  const refreshToken = await _object.save();
  return refreshToken.token;
};

RefreshTokenSchema.statics.verifyExpiration = (token: { expiryDate: Date }) => {
  return token.expiryDate.getTime() < new Date().getTime();
};

const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
