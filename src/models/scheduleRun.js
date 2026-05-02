import mongoose from 'mongoose';

const scheduleRunSchema = new mongoose.Schema(
  {
    depotsSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    vehiclesSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const ScheduleRun = mongoose.models.ScheduleRun || mongoose.model('ScheduleRun', scheduleRunSchema);
