module.exports = app => {
  const image = require("../controllers/image.controller.js");

  var router = require("express").Router();

  router.post("/", image.uploadToGCP);

  router.get("/:imageId", image.downloadFromGCP);

  app.use('/image', router);
};
