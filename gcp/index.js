const path = require('path');
const gm = require('gm').subClass({imageMagick: true});
const fs = require('fs').promises;
const {Storage} = require('@google-cloud/storage');

const config = require('./config.json');

const storage = new Storage();
const {bucket, widths} = config;

exports.resizeImagesOnUploadHTTP = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const busboy = Busboy({headers: req.headers});

    if (!req.files) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    const fileWrite = null;
    const file = null;
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if(fieldname == 'file'){
        if (!mimetype || !mimetype.startsWith('image/')) {
          return res.status(400).send('Only images are allowed');
        }
  
        console.log(`Processing file ${filename}`);
        
        const srcTmpPath = `/tmp/${filename}`;
        const writeStream = fs.createWriteStream(srcTmpPath);
        file.pipe(writeStream);

        fileWrite = new Promise((resolve, reject) => {
          file.on('end', () => {
            writeStream.end();
          });
          writeStream.on('finish', () => {

            fs.readFile(filepath, (err, buffer) => {

              if (err) {
                return reject(err);
              }

              file 
              resolve();
            });
          });
          writeStream.on('error', reject);
        });
      }
    });

    busboy.on('finish', async () => {
      await fileWrite;

      await Promise.all(
        widths.map((width) => {
          console.log(`Processing ${filename} - width: ${width}`);
  
          createImageResizedWidth(fileUploaded, width, fileBucket)
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

    });

  } catch (err) {
    res.status(500).send({
      message: `Could not process the file: ${req.files['file'].name}. ${err}`,
    });
  }
}

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
}

async function createImageResizedWidth( filepath, width, dstBucketName, callback ){
  console.log('createImageResizedWidth', filepath);

  const {base: fileName, name } = path.parse(filePath);

  const dstFileName = `thumb@${width}_${fileName}`;
  const storageDstPath = `${name}/${dstFileName}`;
  console.log(storageDstPath);

  const dstTmpPath = `/tmp/${dstFileName}`;

  await new Promise((resolve, reject) => {
    gm(filepath)
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
      await fs.unlink(srcTmpPath);

      return Promise.resolve(result.dst);  
    });
}