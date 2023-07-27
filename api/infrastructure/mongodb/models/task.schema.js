import mongoose from "mongoose";

export const taskSchema = new mongoose.Schema(
  {
    id: String,
    resource: String,
    path: String,
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const taskModel = mongoose.model('Tasks', taskSchema);

export { taskModel };
