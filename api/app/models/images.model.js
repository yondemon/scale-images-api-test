module.exports = mongoose => {
  const Image = mongoose.model(
    "images",
    mongoose.Schema(
      {
        resource: String,
        path: String,
        md5: String,
        resolution: String,
        processed: { type: Boolean, default: false }
      },
      { timestamps: true }
    )
  );

  return Image;
};