import mongoose from "mongoose";

export const imageSchema = new mongoose.Schema(
  {
    resource: String,
    gcpPath: String,
    md5: String,
    resolution: String,
    thumbs: [{
      width: Number,
      gcpUrl: String,
      resource: String,
    }],
    processed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const imageModel = mongoose.model('Images', imageSchema);
export { imageModel };
