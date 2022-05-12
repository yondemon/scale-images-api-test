const mongoose = require("mongoose");

const dbConfig = require("../../config/db.js");

mongoose.Promise = global.Promise;
// mongoose.set('useFindAndModify', false);

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.URL;

mongoose.connect(dbConfig.URL)
  .then(()=>console.log(`connected ${dbConfig.URL}`))
  .catch(e=>console.log(e));

db.tasks = require("./tasks.model.js")(mongoose);
db.images = require("./images.model.js")(mongoose);

module.exports = db;