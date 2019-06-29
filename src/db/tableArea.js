import baseDb from './basedb'

export default class tableAreaDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/tableArea.db')
  }
}