import baseDb from './basedb'
import Datastore from 'nedb-promises'

class OrderDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/order.db')
    super(datastore)
  }
}

export default new OrderDb()