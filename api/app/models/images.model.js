module.exports = mongoose => {
  const Image = mongoose.model(
    "images",
    mongoose.Schema(
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
    )
  );

  return Image;
};