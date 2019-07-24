export default class BaseDb {
  constructor(_datastore) {
    this.datastore = _datastore
  }

  async find(query, sortField = {
    createAt: -1
  }) {
    return await this.datastore.find(query).sort(sortField)
  }

  async count(query) {
    return await this.datastore.count(query)
  }

  async findOne(doc) {
    return await this.datastore.findOne(doc)
  }

  async insert(doc) {
    doc.createAt = Date.now()
    return await this.datastore.insert(doc)
  }

  async findPageWithSorted(query, sort = {}, page = 1, perPage = 10) {
    return await this.datastore.find(query)
      .sort(sort)
      .limit(perPage)
      .skip((page - 1) * perPage)
  }

  async updateOption(query, doc, options = {
    multi: true
  }) {
    doc.updateAt = Date.now()
    return await this.datastore.update(query, {
      $set: doc
    }, options)
  }

  async remove(doc, option = {
    multi: true
  }) {
    return await this.datastore.remove(doc, option)
  }
}