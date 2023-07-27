export default (mongoose, modelName, schema) => {
  return mongoose.model(modelName, schema);
};
