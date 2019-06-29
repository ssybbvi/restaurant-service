import baseDb from './basedb'
import Datastore from 'nedb-promises'

class ProductTypeDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/productType.db')
    super(datastore)
  }
}

export default new ProductTypeDb()