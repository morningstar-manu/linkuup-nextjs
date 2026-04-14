import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone_1: { type: String, trim: true },
    phone_2: { type: String, trim: true },
    address: { type: String, trim: true },
    commercial: { type: String, trim: true },
    comment: { type: String, trim: true },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'cancelled',
        'not-interested',
        'to-be-reminded',
        'longest-date',
      ],
      default: 'pending',
    },
    /** Date prévue pour rappeler le médecin (utilisé avec statut "to-be-reminded") */
    reminderDate: { type: String, trim: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

appointmentSchema.index({ userId: 1, date: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ createdAt: -1 });

appointmentSchema.plugin(mongoosePaginate);

const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;
