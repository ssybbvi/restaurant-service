import baseDb from './basedb'

export default class RemarkDb extends baseDb {
  constructor() {
    super('./src/db/dbfile/remark.db')
  }
}