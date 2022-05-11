const path = require('path');
const https = require('https');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

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
  if(!fileUploaded){
    return res.status(400).send('No image file found on request');
  }
  try {
    const { mimetype, name: fileName, md5 } = fileUploaded;
    if (!mimetype || !mimetype.startsWith('image/')) {
      return res.status(400).send('Only images are allowed');
    }

    const filePath = path.parse(fileName);
    const fileExtension = filePath.ext;
    const gcFileName = `${uuidv4()}${fileExtension}`;
    // const image = new Image({
    //   resource: gcFileName,
    //   path: fileName,
    //   md5,
    //   resolution: null,
    //   processed: false,
    // });
    // image.save();

    let form = new FormData();
    form.append('image', fileUploaded.data, gcFileName);

    const options = {
      host: gcpDomain,
      method: 'POST',
      path: `/${gcpFunctionTrigger}`,
      headers: form.getHeaders(), 
      timeout: 20000,
    };

    const uploadRequest = https.request(options,
      (uploadResponse) => {
        res.writeHead(uploadResponse.statusCode, uploadResponse.headers);
        uploadResponse.pipe(res);
      });
    uploadRequest.on('timeout', (err) => {res.status(408).send(err)});
    uploadRequest.on('error', (err) => {console.error(err)});
    
    form.pipe(uploadRequest);

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
