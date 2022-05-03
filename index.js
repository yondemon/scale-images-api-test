const express = require("express");
const app = express();

// set port, listen for requests
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.get('/', function (req, res) {
  res.send('OK!');
});