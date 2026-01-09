import { realtimeSessionBillingRoutes } from '../realtimeSessionBillingRoutes'
import agentRoutes from './agentRoutes'
import artifactRoutesV2 from './artifactRoutesV2'
import authRoutesV2 from './authRoutesV2'
import collectionRoutesV2 from './collectionRoutesV2'
import conceptRoutesV2 from './conceptRoutesV2'
import creationRoutesV2 from './creationRoutesV2'
import creatorRoutesV2 from './creatorRoutesV2'
import exportRoutesV2 from './exportRoutesV2'
import feedRoutesV2 from './feedRoutesV2'
import llmCallRoutes from './llmCallRoutes'
import modelRoutesV2 from './modelRoutesV2'
import notificationRoutes from './notificationRoutes'
import realtimeToolRoutesV2 from './realtimeToolRoutesV2'
import sessionRoutesV2 from './sessionRoutesV2'
import taskRoutesV2 from './taskRoutesV2'
import toolRoutesV2 from './toolRoutesV2'
import userRoutes from './userRoutes'
import verdelisSeedRoutesV2 from './verdelisSeedRoutesV2'

export const routes = [
  authRoutesV2,
  creatorRoutesV2,
  toolRoutesV2,
  taskRoutesV2,
  modelRoutesV2,
  conceptRoutesV2,
  creationRoutesV2,
  artifactRoutesV2,
  feedRoutesV2,
  exportRoutesV2,
  collectionRoutesV2,
  agentRoutes,
  userRoutes,
  sessionRoutesV2,
  notificationRoutes,
  llmCallRoutes,
  verdelisSeedRoutesV2,
  realtimeSessionBillingRoutes,
  realtimeToolRoutesV2,
]
