const mongoose = require("mongoose");

const dbConfig = require("../../config/db.js");

mongoose.Promise = global.Promise;
// mongoose.set('useFindAndModify', false);

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

db.tasks = require("./tasks.model.js")(mongoose);
db.images = require("./images.model.js")(mongoose);

module.exports = db;