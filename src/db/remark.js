const Datastore = require('nedb-promises')
let datastore = Datastore.create('./src/db/dbfile/remark.db')

let find = async (query) => {
  return datastore.find(query)
}
let findOne = async (query) => {
  return datastore.findOne(query)
}
let insert = async (doc) => {
  return datastore.insert(doc)
}
let findPageWithSorted = (query, sort = {}, page = 0, perPage = 10) => {
  return datastore.find(query)
    .sort(sort)
    .limit(perPage)
    .skip(page * perPage)
}

let updateOption = async (query, update, options) => {
  return datastore.update(query, update, options)
}

let remove = async (query) => {
  return datastore.remove(query)
}

module.exports = {
  find,
  findOne,
  insert,
  findPageWithSorted,
  updateOption,
  remove,
}