const db = require("../models");
const Task = db.tasks;

exports.create = (req, res) => {
  const msg = 'NEW TASK!';
  console.log(msg);
  res
    .status(200)
    .send({message: msg});
}

exports.status = (req, res) => {
  const taskId = req.params.taskId;
  console.log(`STATUS TASK ${taskId}`);
  if (!taskId) {
    res.status(400).send({ message: "taskId is mandatory" });
    return;
  }

  Task.findById(taskId)
    .then(data => {
      if (!data){
        res.status(404).send({ message: "Not found Task id " + taskId });
      } else {
        res
          .status(200)
          .send(data);
      }
    })
    .catch(err => {
      res
        .status(500)
        .send({ message: "Error retrieving Task id " + taskId });
    });
}
