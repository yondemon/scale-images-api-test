exports.create = (req, res) => {
  const msg = 'NEW TASK!';
  console.log(msg);
  res
    .status(200)
    .send({message: msg});
}

exports.status = (req, res) => {
  const taskId = req.params.taskId;

  const msg = `STATUS TASK ${taskId}`;
  console.log(msg);
  res
    .status(200)
    .send({message: msg});
}
