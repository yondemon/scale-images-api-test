const path = require('path');
const os = require('os');
const fs = require('fs');

const gm = require('gm').subClass({imageMagick: true});
const {Storage} = require('@google-cloud/storage');
const Busboy = require('busboy');

const config = require('./config.json');

const storage = new Storage();
const {bucketName, widths} = config;

exports.resizeImagesOnUploadHTTP = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  try {
    const bb = Busboy({headers: req.headers});
    const tmpdir = os.tmpdir();

    let srcTmpPath = null;
    let fileWrite = null;

    bb.on('file', (fieldName, file, info) => {
      const { filename, mimeType } = info;
      console.log(`on file: ${filename}`, info);
      if(fieldName == 'image'){
        if (!mimeType || !mimeType.startsWith('image/')) {
          return res.status(400).send('Only images are allowed');
        }
        console.log(`Processing image ${filename}`);
        
        srcTmpPath = path.join(tmpdir, filename);
        const writeStream = fs.createWriteStream(srcTmpPath);
        file.pipe(writeStream);

        fileWrite = new Promise((resolve, reject) => {
          file.on('end', () => {
            writeStream.end();
          });
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      }
    });

    bb.on('finish', async () => {
      if(fileWrite !== null) {
        await fileWrite;
        console.log(fileWrite, srcTmpPath);
        const {base: filename} = path.parse(srcTmpPath);

        await Promise.all(
          widths.map((width) => {
            console.log(`Processing ${srcTmpPath} - width: ${width}`);
    
            createImageResizedWidth(srcTmpPath, width, bucketName)
              .then ((storageFileResult) => {
                console.log(`DONE: ${width}`, storageFileResult);
                
                return Promise.resolve(storageFileResult);
              })
              .catch((err) => {
                console.error(`Error on createImageResized: `, err);
                return Promise.reject(err);
              })
          })
        )

        res
          .status(200)
          .send({
            messge: 'processing',
            filename,
            widths: widths.join(',')
          });
      } else {
        res.status(405).end();
      }

    });
    
    bb.end(req.rawBody);
    
  } catch (err) {
    res.status(500).send({
      message: `Could not process the request: ${err}`,
    });
  }
};

exports.resizeImagesOnUploadToBucket = async (event, callback = () =>{}) => {
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

      createImageResizedWidthFromStorage(storageFile, width, fileBucket)
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
};

async function createImageResizedWidth( filePath, width, dstBucketName, callback ){
  console.log('createImageResizedWidth', filePath);

  const tmpdir = os.tmpdir();
  const {base: fileName, name } = path.parse(filePath);

  const dstFileName = `thumb@${width}_${fileName}`;
  const storageDstPath = `${name}/${dstFileName}`;
  console.log(storageDstPath);

  const dstTmpPath = path.join(tmpdir, dstFileName);

  await new Promise((resolve, reject) => {
    gm(filePath)
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
    await bucket.upload(dstTmpPath, {destination: storageDstPath});
    console.log(`Uploaded image to: ${storageDstPath}`, {
      image: fileName,
      dst: storageDstPath,
      width: width,
    });
    callback({
      image: fileName,
      dst: storageDstPath,
      width: width,
    });
  } catch (err) {
    throw new Error(`Unable to upload image to ${storageDstPath}: ${err}`);
  }

  return Promise.resolve();
}

async function createImageResizedWidthFromStorage(storageFile, width, dstBucketName){
  console.log('createImageResizedWidthFromStorage', storageFile.name);
  const filePath = storageFile.name;
  const {base: fileName } = path.parse(filePath);
  
  const srcTmpPath = `/tmp/${fileName}`;

  try {
    await storageFile.download({destination: srcTmpPath});
    console.log(`Downloaded ${storageFile.name} to ${srcTmpPath}`);
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  createImageResizedWidth( srcTmpPath, width, dstBucketName, 
    async (result) => {
      await fs.promises.unlink(srcTmpPath);

      return Promise.resolve(result.dst);  
    });
}