import MongoImageRepository from  '../infrastructure/mongodb/images.repository.js';
import MongoTaskRepository from  '../infrastructure/mongodb/tasks.repository.js';

import ImagesService from './images.service.js';
import TasksService from './tasks.service.js';

const imagesService = ImagesService(MongoImageRepository);
const tasksService = TasksService(MongoTaskRepository);

export { imagesService, tasksService };
