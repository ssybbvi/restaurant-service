import baseDb from './basedb'

export default class ProductDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/product.db')
  }
}