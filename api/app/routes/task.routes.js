const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

module.exports = app => {
  const task = require("../controllers/task.controller.js");

  var router = require("express").Router();

  router.post("/", upload.single('image'), task.create);

  router.get("/:taskId", task.status);

  app.use('/task', router);
};
