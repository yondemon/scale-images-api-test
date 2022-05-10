module.exports = mongoose => {
  const Task = mongoose.model(
    "tasks",
    mongoose.Schema(
      {
        resource: String,
        path: String,
        done: { type: Boolean, default: false }
      },
      { timestamps: true }
    )
  );

  return Task;
};