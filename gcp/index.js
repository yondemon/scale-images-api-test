const path = require('path');
const gm = require('gm').subClass({imageMagick: true});
const fs = require('fs').promises;
const {Storage} = require('@google-cloud/storage');

const config = require('./config.json');
const { stdout } = require('process');

const storage = new Storage();
const {bucket, widths} = config;

exports.createResizedImagesFromBucket = (req, res) => {
  const filename = req.query.f;
  const widths = req.query.widths;

  if (!filename) {
    res.status(400).send("No filename");
    return;
  }

  console.log(`Bucket: ${bucket} - File: ${filename}`);
  const dir = path.dirname(filename);
  const storageFile = storage.bucket(bucket).file(filename);

  witdhs = widthsQuery.split(',');
  widths.each((width) => {
    console.log(`Processing width: ${width}`);

    createImageResizedWidth(storageFile, width)
      .then ((storageFileResult) => {
        res.status(200).send({
          image: storageFileResult,
          original: filename,
          width
        });
      })
      .catch((err) => {
        console.error(`Error on createImageResized: `, err);
        return Promise.reject(err);
      })

  })
}

exports.resizeImagesOnUpload = async (event, callback = () =>{}) => {
  // console.log('Event:', event);
  const {bucket: fileBucket, name: filePath, contentType, resourceState, metageneration } = event;

  if( filePath.includes('thumb@') ) {
    console.log(`${filePath} is already a thumbnail`)
    if (typeof callback === 'function') callback();
    return false;
  }
  if (!contentType.startsWith('image/') ){
    console.log(`${filePath} is not an image [${contentType}]`)
    if (typeof callback === 'function') callback();
    return false;
  }
  if (resourceState === 'not_exists') {
    console.log('Delete event');
    if (typeof callback === 'function') callback();
    return false;
  }
  if (resourceState === 'exists' && metageneration > 1) {
    console.log('Metadata change event');
    if (typeof callback === 'function') callback();
    return false;
  }

  const storageFile = storage.bucket(fileBucket).file(filePath);
  const storageFilePath = `gs://${fileBucket}/${filePath}`;
  // console.log('Storage File:', storageFile);

  await Promise.all(
    widths.map((width) => {
      console.log(`Processing ${storageFilePath} - width: ${width}`);

      createImageResizedWidth(storageFile, width, fileBucket)
        .then ((storageFileResult) => {
          console.log(`DONE: ${width} ${storageFileResult}`);
          return Promise.resolve(storageFileResult);
        })
        .catch((err) => {
          console.error(`Error on createImageResized: `, err);
          return Promise.reject(err);
        })
    })
  )
    
  if (typeof callback === 'function') callback();
  return;
}

async function createImageResizedWidth(storageFile, width, dstBucketName){
  console.log('createImageResizedWidth', storageFile.name);
  const filePath = storageFile.name;
  const {base: fileName, name } = path.parse(filePath);

  const dstFileName = `thumb@${width}_${fileName}`;
  // const srcPath = `gs://${bucket}/${filename}`;
  // const storeageDstPath = `gs://${dstBucketName}/${name}/${dstFileName}`;
  const storeageDstPath = `${name}/${dstFileName}`;
  
  console.log(storeageDstPath);

  const srcTmpPath = `/tmp/${fileName}`;
  const dstTmpPath = `/tmp/${dstFileName}`;

  try {
    await storageFile.download({destination: srcTmpPath});
    console.log(`Downloaded ${storageFile.name} to ${srcTmpPath}`);
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  await new Promise((resolve, reject) => {
    gm(srcTmpPath)
      .resize(width)
      .write(dstTmpPath, (err, stdout) => {
        if(err) {
          console.log(`Error: `, err);
          reject(err);
        } else {
          console.log(`Done: [${width}] ${dstTmpPath}`);
          resolve(stdout);
        }
      });
  });
  
  console.log(dstBucketName);
  const bucket = storage.bucket(dstBucketName);
  try {
    await bucket.upload(dstTmpPath, {destination: storeageDstPath});
    console.log(`Uploaded image to: ${storeageDstPath}`);
  } catch (err) {
    throw new Error(`Unable to upload image to ${storeageDstPath}: ${err}`);
  }

  await Promise.all([
    fs.unlink(srcTmpPath),
    fs.unlink(dstTmpPath)
  ]);

  return Promise.resolve(storeageDstPath);
}