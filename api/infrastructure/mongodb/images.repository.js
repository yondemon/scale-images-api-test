import { imageModel } from './models/image.schema.js';

export const MongoImageRepository = {
  async getImageById( id ) {
    return imageModel.findOne({id: id});
  },

  async createImage( image ) {
    return imageModel.create(image)
  },

  async updateTask( image ) {
    const filter = { _id: image._id }
    const update = { ...image }

    return await imageModel.findOneAndUpdate(filter, update, {
      new: true, 
    });
  }
}

export default MongoImageRepository

