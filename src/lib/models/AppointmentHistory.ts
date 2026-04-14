import mongoose from 'mongoose';

/**
 * Enregistre chaque modification d'un rendez-vous.
 * Immuable — jamais supprimé, jamais modifié après écriture.
 */
const appointmentHistorySchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    /** Utilisateur qui a effectué l'action */
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    /** Type d'action : created | updated | deleted */
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    /** Champs modifiés : { status: { from: 'pending', to: 'confirmed' } } */
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    // Pas de versionning — document immuable
    versionKey: false,
  }
);

const AppointmentHistory =
  mongoose.models.AppointmentHistory ||
  mongoose.model('AppointmentHistory', appointmentHistorySchema);

export default AppointmentHistory;
