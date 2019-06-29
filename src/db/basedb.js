import Datastore from 'nedb-promises'

export default class BaseDb {
  constructor(dbFile) {
    this.datastore = Datastore.create(dbFile)
  }

  find(query) {
    return this.datastore.find(query)
  }

  findOne(query) {
    return this.datastore.findOne(query)
  }

  insert(doc) {
    return this.datastore.insert(doc)
  }
  findPageWithSorted(query, sort = {}, page = 0, perPage = 10) {
    return this.datastore.find(query)
      .sort(sort)
      .limit(perPage)
      .skip(page * perPage)
  }

  updateOption(query, update, options) {
    return this.datastore.update(query, update, options)
  }

  remove(query) {
    return this.datastore.remove(query)
  }
}