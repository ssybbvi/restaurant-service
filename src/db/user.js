import baseDb from './basedb'
import Datastore from 'nedb-promises'

class UserDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/user.db')
    super(datastore)
  }
}

export default new UserDb()