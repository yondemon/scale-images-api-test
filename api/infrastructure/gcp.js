import gcpConfig from "../config/gcp.config.js";

export const postImageToGCP = (fileUploaded, taskId, callback) => {
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
  
  // console.log('Uploading', form);
  form.pipe(uploadRequest);
};
