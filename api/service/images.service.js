const ImageService = (MongoImageRepository) => {
  function createImage (image) {
    MongoImageRepository.createImage(image);
  }

  function updateImage (image) {
    MongoImageRepository.updateImage(image);
  }

  function updateImageByResource (resource, image) {
    MongoImageRepository.updateImageByResource(image);
  }

  function getImageById (id) {
    return MongoImageRepository.getImageById(id);
  }

  return {
    createImage,
    updateImage,
    getImageById
  }
}

export default ImageService;
