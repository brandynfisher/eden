import { TaskDocument } from '../models/Task'
import RestfulRepository from './RestfulRepository'

/**
 * @class MoviesRepository
 */
export default class TaskRepository extends RestfulRepository<TaskDocument> {}
