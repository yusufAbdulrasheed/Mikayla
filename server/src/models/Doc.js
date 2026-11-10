import mongoose from 'mongoose';

const docSchema = new mongoose.Schema(
  {
    col: { type: String, required: true, index: true },
    id: { type: String, required: true },
    order: { type: Number, default: 0 },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);
docSchema.index({ col: 1, id: 1 }, { unique: true });

export default mongoose.model('Doc', docSchema);
