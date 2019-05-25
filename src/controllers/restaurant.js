import * as tableDb from '../db/table'
import * as orderDb from '../db/order'
import * as productDb from '../db/product'

export let OpenTable = async (ctx) => {
  let {
    tableId,
    seat
  } = ctx.request.body

  let table = await tableDb.findOne({
    _id: tableId
  })

  if (table.status != tableDb.tableStatus.available) {
    return ctx.body = {
      result: false,
      data: "桌子使用中"
    }
  }

  let order = await orderDb.insert({
    startDateTime: new Date().getTime(),
    tableId: tableId,
    productItems: [],
    status: orderDb.orderStaus.processing,
    totalPrice: 0,
    paymentPrice: 0,
    offerPriceItems: [],
    eventItems: []
  })

  await tableDb.update({
    _id: tableId
  }, {
    $set: {
      status: tableDb.tableStatus.dining,
      startDateTime: new Date().getTime(),
      seat: seat,
      orderId: order._id
    }
  }, {})

  return ctx.body = {
    result: true,
    data: order
  }
}

export let updateOrderProduct = async (ctx) => {
  let doc = ctx.request.body
  let order = await orderDb.findOne({
    _id: doc._id
  })
  if (!order) {
    return ctx.body = {
      result: false,
      data: "无此订单"
    }
  }

  order.productItems = doc.productItems
  order.totalPrice = doc.productItems.reduce((total, current) => {
    total += current.price
    return total
  }, 0)
  order.paymentPrice = doc.totalPrice

  await orderDb.update({
    _id: order._id
  }, {
    $set: order
  }, {})

  return ctx.body = {
    result: true,
    data: order
  }
}

export let paymentOrder = async (ctx) => {
  let {
    orderId,
    paymentPrice
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: doc._id
  })
  if (!order) {
    return ctx.body = {
      result: false,
      data: "无此订单"
    }
  }

  await orderDb.update({
    _id: order._id
  }, {
    $set: {
      paymentPrice: paymentPrice,
      endDateTime: new Date().getTime(),
      status: orderDb.orderStaus.finish
    }
  }, {})

  await tableDb.update({
    _id: order.tableId
  }, {
    $set: {
      status: tableDb.tableStatus.available,
    }
  })

  return ctx.body = {
    result: true,
    data: null
  }
}