import baseDb from './basedb'

export default class OrderDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/order.db')
  }
}