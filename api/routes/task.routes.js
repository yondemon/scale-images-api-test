import express from 'express';
import task from "../controllers/task.controller.js";
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

export default (app) => {
  var router = express.Router();

  router.post("/", upload.single('image'), task.create);
  router.get("/:taskId", task.status);

  app.use('/task', router);
};
