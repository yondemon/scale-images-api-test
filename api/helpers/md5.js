import crypto from 'crypto';

export const getMD5FromFile = (file) => {
  const hash = crypto.createHash('md5');
  hash.update(file);
  return hash.digest('hex');
}
