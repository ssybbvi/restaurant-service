import baseDb from './basedb'
import Datastore from 'nedb-promises'

class ConfigsDb extends baseDb {
  constructor() {
    let datastore = Datastore.create('./src/db/dbfile/configs.db')
    super(datastore)
  }
}

export default new ConfigsDb()