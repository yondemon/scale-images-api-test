const TasksService = (MongoTaskRepository) => {
  function createTask (task) {
    MongoTaskRepository.createTask(task);
  }

  function updateTask (task) {
    MongoTaskRepository.updateTask(task);
  }

  function getTaskById (id) {
    return MongoTaskRepository.getTaskById(id);
  }

  return {
    createTask,
    updateTask,
    getTaskById
  }
}

export default TasksService;

