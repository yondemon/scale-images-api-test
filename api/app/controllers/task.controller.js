const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const gcpConfig = require("../../config/gcp.config.js");

const db = require("../models");
const Task = db.tasks;
const Image = db.images;

const bucketName = gcpConfig.bucketName;

exports.create = async (req, res) => {
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

    const taskId = uuidv4();

    persistImageData({fileName, gcpPath: fileName, taskId, md5});
    createTaskData({fileName, taskId});

    postImageToGCP(
      fileUploaded,
      taskId, 
      (uploadResponse) => {
        res.writeHead(uploadResponse.statusCode, uploadResponse.headers);
        uploadResponse.pipe(res);
      });

  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${fileUploaded.name}. ${err}`,
    });
  }
}

exports.status = async (req, res) => {
  const taskId = req.params.taskId;

  if (!taskId) {
    res.status(400).send({ message: "taskId is mandatory" });
    return;
  }

  const task = await Task.findOne({ id: taskId }).exec();

  const fileName = task.resource;
  const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  console.log(url);

  const widths = [800,1024];

  const filePath = path.parse(fileName);
  const thumbFileBaseDir = path.resolve(__dirname,`../../public/output/${filePath.name}/`);
  const thumbUrlBaseDir = `http://${req.headers.host}:3200/output/${filePath.name}`;

  try {
    const thumbs = widths.map((width) => {
      const thumbTempFileName = `thumb@${width}_${fileName}`;
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${filePath.name}/${thumbTempFileName}`;

      const thumbFileDir = path.resolve(thumbFileBaseDir,width.toString());
      const thumbUrlDir = `${thumbUrlBaseDir}/${width}`;
      if (!fs.existsSync(thumbFileDir)){
        fs.mkdirSync(thumbFileDir, { recursive: true });
      }
    
      const thumbFileTempPath = path.join(thumbFileDir, thumbTempFileName);
      console.log(thumbFileTempPath);

      const file = fs.createWriteStream(thumbFileTempPath);
      https.get(fileUrl, (res) => {
        res.pipe(file);
    
        file.on("finish", async () => {
          file.close();
          const md5 = await getMD5FromFile(thumbFileTempPath);
          
          const thumbFileName = `${md5}${filePath.ext}`;
          const thumbFilePath = path.join(thumbFileDir, thumbFileName);
          console.log(thumbFileTempPath, thumbFilePath);
          fs.rename(thumbFileTempPath, thumbFilePath, (error) => {
            if (error) {
              console.log(error);
            }
          });
          
          console.log(`Downloaded ${fileUrl}\n to ${thumbFilePath}`);


          const task = updateTaskData({id: taskId, done: true });
          Image.update({resource: task.resource},
            {$push: {thumbs: {
              width,
              gcpUrl: fileUrl,
              resource: thumbFileName,
              resolution: width,
            }}},
            {},
            (err) => {
              if(err){
                console.log(err);
              }else{
                console.log(`Added thumb ${thumbFileName} to DB`, );
              }
            });

            return `${thumbUrlDir}/${thumbFileName}`;
        })
      });
  
      return thumbUrl;
    })
  
    res.status(200).send({
      thumbs
    });
  }
  catch (err) {
    res.status(500).send(`Error: ${err}`);
  }
}

const createTaskData = (data) => {
  const task = new Task({
    id: data.taskId,
    resource: data.fileName,
    path: data.fileName,
    done: data.done,
  });

  task.save((err, img) => {
    if (err) return console.log(err);
    console.log(`Saved`, img);
  });
}

const updateTaskData = async (data) => {
  let res = await Taks.findOneAndUpdate(
    { id: data.id }, 
    { done: data.done },
    {
      new: true,
      upsert: true,
      rawResult: true
    }
  );
  return res;
}

const persistImageData = (data) => {
  const image = new Image({
    resource: data.fileName,
    gcpPath: data.gcpPath,
    md5: data.md5,
    resolution: null,
    processed: false,
  });

  image.save((err, img) => {
    if (err) return console.log(err);
    console.log(`Saved`, img);
  });
};

const postImageToGCP = (fileUploaded, taskId, callback) => {
  const { domain: gcpDomain, functionHttpsTrigger: gcpFunctionTrigger } = gcpConfig;

  let form = new FormData();
  form.append('task', taskId);
  form.append('callbackEndpoint', `/task/${taskId}`);
  form.append('image', fileUploaded.data, fileUploaded.name);

  const options = {
    host: gcpDomain,
    method: 'POST',
    path: `/${gcpFunctionTrigger}`,
    headers: form.getHeaders(), 
    timeout: 20000,
  };

  const uploadRequest = https.request(options, callback);

  uploadRequest.on('timeout', (err) => {res.status(408).send(err)});
  uploadRequest.on('error', (err) => {console.error(err)});
  
  form.pipe(uploadRequest);
};

const getMD5FromFile = (file) => {
  const hash = crypto.createHash('md5');
  hash.update(file);
  return hash.digest('hex');
}