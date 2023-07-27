import { taskModel } from './models/task.schema.js';

export const MongoTaskRepository = {
  async getTaksById( id ) {
    return taskModel.findOne({id: id});
  },

  async createTask( task ) {
    return taskModel.create(task)
  },

  async updateTask( task ) {
    const filter = { id: task.id }
    const update = { ...task }

    return await taskModel.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      rawResult: true
    });
  }
}

export default MongoTaskRepository
