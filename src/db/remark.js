import baseDb from './basedb'
import Datastore from 'nedb-promises'

class RemarkDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/remark.db')
    super(datastore)
  }
}

export default new RemarkDb()