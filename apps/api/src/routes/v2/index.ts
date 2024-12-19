import agentRoutes from './agentRoutes'
import collectionRoutesV2 from './collectionRoutesV2'
import creationRoutesV2 from './creationRoutesV2'
import creatorRoutesV2 from './creatorRoutesV2'
import feedRoutesV2 from './feedRoutesV2'
import modelRoutesV2 from './modelRoutesV2'
import taskRoutesV2 from './taskRoutesV2'
import threadRoutes from './threadRoutes'
import toolRoutesV2 from './toolRoutesV2'

export const routes = [
  creatorRoutesV2,
  toolRoutesV2,
  taskRoutesV2,
  modelRoutesV2,
  creationRoutesV2,
  feedRoutesV2,
  collectionRoutesV2,
  threadRoutes,
  agentRoutes,
]
