import fs from 'fs';
import https from 'https';
import path from 'path';
import  { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';

import gcpConfig from '../config/gcp.config.js';
import { imagesService, tasksService } from '../service/index.js';

const { bucketName } = gcpConfig;
const storage = new Storage();

const uploadToGCP = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
        
    const fileUploaded = req.files['file'];
    const { mimetype, name } = fileUploaded;
    if (!mimetype || !mimetype.startsWith('image/')) {
      return res.status(400).send('Only images are allowed');
    }

    const filePath = path.parse(name);
    const fileExtension = filePath.ext;
    const fileName = `${uuidv4()}${fileExtension}`;
    
    try {
      imageService.createImage({
        resource: fileName,
        path: fileName,
        md5: null,
        resolution: null,
        processed: false,
      });
    } catch (err) {
      return console.log(err);
    }
    console.log(`Saved`, img);

    const storageFile = storage.bucket(bucketName).file(fileName);

    await storageFile.save(fileUploaded.data, {
      contentType: mimetype,
      resumable: false,
      // public: true,
    });
    const url = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`${name} uploaded to ${bucketName}`, url);

    return res.status(200).send(url);
      
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.files['file'].name}. ${err}`,
    });
  }
}

const updateUploadedToGCP = async (req, res) => {
  const imageId = req.params.imageId;
  console.log(`processed! ${imageId} download`);

  const fileName = '/output/test.jpg';
  const file = fs.createWriteStream(fileName);
  https.get(resourceUrl, (res) => {
    res.pipe(file);

    file.on("finish", () => {
      file.close();
      console.log(`Downloaded ${fileName}`);
    })
  });

  res.status(200).send();
};

const mapImageDataFromData = (data) => {
  return {
    resource: data.fileName,
    gcpPath: data.gcpPath,
    md5: data.md5,
    resolution: null,
    processed: false,
  };
};

export default { uploadToGCP, updateUploadedToGCP };