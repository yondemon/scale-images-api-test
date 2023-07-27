import express from 'express';
import image from "../controllers/image.controller.js";

export default (app) => {
  var router = express.Router();

  router.post("/", image.uploadToGCP);
  router.patch("/;imageId", image.updateUploadedToGCP);
  // router.get("/:imageId", image.downloadFromGCP);

  app.use('/image', router);
};
