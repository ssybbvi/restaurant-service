import baseDb from './basedb'

export default class OrderItemDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/orderItem.db')
  }
}