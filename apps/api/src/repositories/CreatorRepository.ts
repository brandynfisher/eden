import { UserDocument } from '../models/Creator'
import RestfulRepository from './RestfulRepository'

/**
 * @class MoviesRepository
 */
export default class CreatorRepository extends RestfulRepository<UserDocument> {}
