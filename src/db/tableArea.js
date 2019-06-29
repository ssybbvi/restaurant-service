import baseDb from './basedb'
import Datastore from 'nedb-promises'

class tableAreaDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/tableArea.db')
    super(datastore)
  }
}

export default new tableAreaDb()