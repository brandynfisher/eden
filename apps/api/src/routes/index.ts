import apiKeyRoutes from './apiKeyRoutes'
import authRoutes from './authRoutes'
import characterRoutes from './characterRoutes'
import collectionRoutes from './collectionRoutes'
import creationRoutes from './creationRoutes'
import creatorRoutes from './creatorRoutes'
import generatorRoutes from './generatorRoutes'
import loraRoutes from './loraRoutes'
import mannaRoutes from './mannaRoutes'
import mediaRoutes from './mediaRoutes'
import mintRoutes from './mintRoutes'
import taskRoutes from './taskRoutes'
import userRoutes from './user/userRoutes'

export const routes = [
  authRoutes,
  mannaRoutes,
  apiKeyRoutes,
  mediaRoutes,
  userRoutes,
  creatorRoutes,
  creationRoutes,
  collectionRoutes,
  mintRoutes,
  loraRoutes,
  characterRoutes,
  generatorRoutes,
  taskRoutes,
]
