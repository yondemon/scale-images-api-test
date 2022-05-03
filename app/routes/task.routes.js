module.exports = app => {
  const task = require("../controllers/task.controller.js");

  var router = require("express").Router();

  router.post("/", task.create);

  router.get("/:taskId", task.status);

  app.use('/task', router);
};
