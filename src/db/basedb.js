export default class BaseDb {
  constructor(_datastore) {
    this.datastore = _datastore
  }

  async find(query) {
    return await this.datastore.find(query)
  }

  async findOne(query) {
    return await this.datastore.findOne(query)
  }

  async insert(doc) {
    return await this.datastore.insert(doc)
  }

  async findPageWithSorted(query, sort = {}, page = 0, perPage = 10) {
    return await this.datastore.find(query)
      .sort(sort)
      .limit(perPage)
      .skip(page * perPage)
  }

  async updateOption(query, update, options = {
    multi: true
  }) {
    return await this.datastore.update(query, update, options)
  }

  async remove(query) {
    return await this.datastore.remove(query)
  }
}