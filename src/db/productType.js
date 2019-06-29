import baseDb from './basedb'

export default class ProductTypeDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/productType.db')
  }
}