import express from 'express';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import path from 'path';

import taskRoutes from "../routes/task.routes.js";
import imageRoutes from "../routes/image.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/output', express.static(__dirname + '/public/output', {index: false}));

app.use(fileUpload({
  createParentPath: true
}));

app.get('/', function (req, res) {
  res.send('OK!');
});

taskRoutes(app);
imageRoutes(app);

export default app;