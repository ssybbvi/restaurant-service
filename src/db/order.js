const Datastore = require('nedb-promises')
let datastore = Datastore.create('./src/db/dbfile/order.db')

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

let update = async (query, update, options) => {
  return datastore.update(query, update, options)
}

let remove = async (query) => {
  return datastore.remove(query)
}

let orderStaus = {
  processing: 1,
  finish: 2
}

module.exports = {
  find,
  findOne,
  insert,
  findPageWithSorted,
  update,
  remove,
  orderStaus
}