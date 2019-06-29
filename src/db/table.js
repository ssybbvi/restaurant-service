import baseDb from './basedb'
import Datastore from 'nedb-promises'

class TableDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/table.db')
    super(datastore)
  }
}

export default new TableDb()