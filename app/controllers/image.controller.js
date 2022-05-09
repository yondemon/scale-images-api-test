const path = require('path');
const {Storage} = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const gcpConfig = require("../../config/gcp.config.js");

const bucketName = gcpConfig.bucketName;
const storage = new Storage();

exports.uploadToGCP = async (req, res) => {
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
