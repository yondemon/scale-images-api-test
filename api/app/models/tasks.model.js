module.exports = mongoose => {
  const Task = mongoose.model(
    "tasks",
    mongoose.Schema(
      {
        id: String,
        resource: String,
        path: String,
        done: { type: Boolean, default: false }
      },
      { timestamps: true }
    )
  );

  return Task;
};