const express = require("express");
const fileUpload = require('express-fileupload');
const app = express();

app.use('/output', express.static(__dirname + '/public/output', {index: false}));

app.use(fileUpload({
  createParentPath: true
}));

app.get('/', function (req, res) {
  res.send('OK!');
});
require("./app/routes/task.routes")(app);
require("./app/routes/image.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}.`);
});
