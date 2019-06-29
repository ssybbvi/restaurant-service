import baseDb from './basedb'
import Datastore from 'nedb-promises'

class OrderItemDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/orderItem.db')
    super(datastore)
  }
}

export default new OrderItemDb()