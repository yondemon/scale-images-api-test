import MongoDB from '../infrastructure/mongodb.js';
import dbConfig from '../config/db.js';

const init = async () => {
  await MongoDB(dbConfig.URI);
  // console.log(dbConfig.URI);
}

export default init;
