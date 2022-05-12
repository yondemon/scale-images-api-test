const path = require('path');
const fs = require('fs');
const https = require('https');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

const gcpConfig = require("../../config/gcp.config.js");

const db = require("../models");
const Image = db.images;

const bucketName = gcpConfig.bucketName;

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
    
    const image = new Image({
      resource: fileName,
      gcpPath: gcFileName,
      md5,
      resolution: null,
      processed: false,
    });
    image.save((err, img) => {
      if (err) return console.log(err);
      console.log(`Saved`, img);
    });

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

  const fileName = `${taskId}.jpg`
  const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  console.log(url);

  const widths = [800,1024];

  const filePath = path.parse(fileName);
  const thumbFileBaseDir = path.resolve(__dirname,`../../public/output/${filePath.name}/`);
  const thumbUrlBaseDir = `http://localhost:3200/output/${filePath.name}`;

  try {
    const thumbs = widths.map((width) => {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${taskId}/thumb@${width}_${fileName}`;

      const thumbFileDir = path.resolve(thumbFileBaseDir,width.toString());
      const thumbUrlDir = `${thumbUrlBaseDir}/${width}`;
      if (!fs.existsSync(thumbFileDir)){
        fs.mkdirSync(thumbFileDir, { recursive: true });
      }
    
      const thumbFileName = `${`md5`}${filePath.ext}`;
      const thumbFilePath = path.join(thumbFileDir, thumbFileName);
      const thumbUrl = `${thumbUrlDir}/${thumbFileName}`;
      console.log(thumbFilePath);

      const file = fs.createWriteStream(thumbFilePath);
      https.get(fileUrl, (res) => {
        res.pipe(file);
    
        file.on("finish", () => {
          file.close();
          console.log(`Downloaded ${fileUrl}\n to ${thumbFilePath}`);

          Image.update({gcpPath: `${taskId}.jpg`},
            {$push: {thumbs: {
              width,
              gcpUrl: fileUrl,
              resource: thumbFileName,
            }}},
            {},
            (err) => {
              if(err){
                console.log(err);
              }else{
                console.log(`Added thumb ${thumbFileName} to DB`, );
              }
            });
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
