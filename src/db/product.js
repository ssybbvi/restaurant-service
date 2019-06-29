import baseDb from './basedb'
import Datastore from 'nedb-promises'

class ProductDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/product.db')
    super(datastore)
  }
}

export default new ProductDb()