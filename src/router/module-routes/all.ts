import homeRoutes from './home'
import accountingRoutes from './accounting'
import purchaseRoutes from './purchase'
import salesRoutes from './sales'
import storeRoutes from './store'
import hrRoutes from './hr'
import collectionRoutes from './collection'
import productionRoutes from './production'
import type { TRoute } from 'src/models/general'

const allRoutes: TRoute[] = []
allRoutes.push(
  ...homeRoutes,
  ...accountingRoutes,
  ...purchaseRoutes,
  ...salesRoutes,
  ...storeRoutes,
  ...hrRoutes,
  ...collectionRoutes,
  ...productionRoutes,
)
export default allRoutes
