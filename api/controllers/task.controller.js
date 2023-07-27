import fs from 'fs';
import https from 'https';
import path from 'path';
import  { v4 as uuidv4 } from 'uuid';

import { getMD5FromFile } from '../helpers/md5.js';
import { postImageToGCP } from '../infrastructure/gcp.js';
import { imagesService, tasksService } from '../service/index.js';
import gcpConfig from '../config/gcp.config.js';

const { bucketName } = gcpConfig;

const create = async (req, res) => {
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
    imagesService.createImage({fileName, gcpPath: fileName, taskId, md5});
    tasksService.createTask(createTaskData({fileName, taskId}));

    postImageToGCP(
      fileUploaded,
      taskId, 
      (uploadResponse) => {
        console.log('uploadResponse');
        // res.writeHead(uploadResponse.statusCode, uploadResponse.headers);
        // uploadResponse.pipe(res);      
        return res.json({
          taskId,
        }).send();
      });

  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${fileUploaded.name}. ${err}`,
    });
  }
}


const status = async (req, res) => {
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
      // console.log(thumbFileTempPath);

      const file = fs.createWriteStream(thumbFileTempPath);
      https.get(fileUrl, (res) => {
        res.pipe(file);
    
        file.on("finish", async () => {
          file.close();
          const md5 = await getMD5FromFile(thumbFileTempPath);
          
          const thumbFileName = `${md5}${filePath.ext}`;
          const thumbFilePath = path.join(thumbFileDir, thumbFileName);
          // console.log(thumbFileTempPath, thumbFilePath);
          fs.rename(thumbFileTempPath, thumbFilePath, (error) => {
            if (error) {
              console.error(error);
            }
          });
          
          console.log(`Downloaded ${fileUrl}\n to ${thumbFilePath}`);


          const task = taskService.updateTask({id: taskId, done: true });
          imagesService.updateImageByResource(
            {

            }
          )
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
                console.error(err);
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
  return {
    id: data.taskId,
    resource: data.fileName,
    path: data.fileName,
    done: data.done,
  };
}

export default { create, status };
