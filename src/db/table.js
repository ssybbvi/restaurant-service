import baseDb from './basedb'

export default class TableDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/table.db')
  }
}