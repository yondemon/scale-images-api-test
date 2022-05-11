const https = require('https');

const gcpConfig = require("../../config/gcp.config.js");

const db = require("../models");
const Task = db.tasks;

exports.create = async (req, res) => {
  const { domain: gcpDomain, functionHttpsTrigger: gcpFunctionTrigger } = gcpConfig;
  console.log('task.create');

  if (!req.files) {
    return res.status(400).send({ message: "Please upload a file!" });
  }

  const fileUploaded = req.files['image'];
  console.log(fileUploaded);
  try {

    const { mimetype, name: fileName, md5 } = fileUploaded;
    if (!mimetype || !mimetype.startsWith('image/')) {
      return res.status(400).send('Only images are allowed');
    }

    // const filePath = path.parse(fileName);
    // const fileExtension = filePath.ext;
    // const fileName = `${uuidv4()}${fileExtension}`;
    // const image = new Image({
    //   resource: fileName,
    //   path: fileName,
    //   md5,
    //   resolution: null,
    //   processed: false,
    // });
    // image.save();

    let options = {
      host: gcpDomain,
      method: 'POST',
      path: `/${gcpFunctionTrigger}`,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileUploaded.size
      }
    };

    const uploadRequest = https.request(options, uploadResponse => {
      console.log(uploadResponse);
      res.writeHead(uploadResponse.statusCode, uploadResponse.headers);
      uploadResponse.pipe(res);
    });

    uploadRequest.write(fileUploaded.data);
    uploadRequest.end();

  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${fileUploaded.name}. ${err}`,
    });
  }
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
