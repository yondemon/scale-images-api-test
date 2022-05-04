const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const path = require('path');
const im = require('imagemagick');

const bucket = "personal-310814-uploadimages";


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

exports.resizeImagesOnUpload = (event, callback) => {
  console.log(event);
  const {bucket, filename } = event;
  const widths = [800,1024];

  const storageFile = storage.bucket(bucket).file(filename);
  console.log(storageFile);

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
  
  if(callback) callback();
  return;
}

async function createImageResizedWidth(storageFile, width){
  const parsedFilename = path.parse(storageFile.name);
  const filename = parsedFilename.base;
  const dir = parsedFilename.dir;
  const ext = parsedFilename.ext;

  task = im.resize({
    srcPath: storageFile,
    dstPath: `${filename}/${filename}-${width}.${ext}`,
    width:   width
  }, function(err, stdout, stderr){
    if (err) throw err;
    console.log(`Resized ${filename} to ${width}px width`);
  });
  return task;
}