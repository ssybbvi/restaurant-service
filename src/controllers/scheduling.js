import tableAreaDb from '../db/tableArea'
import orderItemDB from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'
import enumerate from '../db/enumerate'
import userDb from '../db/user'
import {
  getWaitCookQueues,
  setWaitCookQueues,
  initWaitCookQueues,
  loadOrderItemToWaitCookQueues
} from '../services/waitCookQueues'
import {
  HttpOk,
  HttpError
} from './httpHelp'