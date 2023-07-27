import mongoose from 'mongoose';

export default async function mongodb(dbUri) {
  let db = mongoose.connection;
  if (db.readyState >= 1) return db;
  const client = mongoose.connect(dbUri, {
    autoIndex: true,
  }).then((connection) => {
    console.log(`connected ${dbConfig.URL}`);
    return connection;
  })
  .catch(e=>console.log(e));

  // client.connection.on('error', (err) => console.error('MongoDB Error', err));
  return mongoose.connection;
}
