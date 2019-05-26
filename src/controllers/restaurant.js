import * as tableDb from '../db/table'
import * as orderDb from '../db/order'
import * as productDb from '../db/product'
import enumerate from '../db/enumerate'

export let OpenTable = async (ctx) => {
  let {
    tableId,
    seat
  } = ctx.request.body

  let table = await tableDb.findOne({
    _id: tableId
  })

  if (table.status != enumerate.tableStatus.available) {
    return ctx.body = {
      result: false,
      data: "桌子使用中"
    }
  }

  let order = await orderDb.insert({
    startDateTime: new Date().getTime(),
    tableId: tableId,
    tableName: table.name,
    productItems: [],
    status: enumerate.orderStatus.processing,
    totalPrice: 0,
    paymentPrice: 0,
    offerPriceItems: [],
    eventItems: []
  })

  await tableDb.updateOption({
    _id: tableId
  }, {
    $set: {
      status: enumerate.tableStatus.dining,
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

  doc.productItems = doc.productItems.filter(f => f.quantity > 0)

  order.productItems = doc.productItems
  order.totalPrice = doc.productItems.reduce((total, current) => {
    total += current.price * current.quantity
    return total
  }, 0)
  order.paymentPrice = doc.paymentPrice

  await orderDb.updateOption({
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

  console.log(ctx.request.body)

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    return ctx.body = {
      result: false,
      data: "无此订单"
    }
  }

  await orderDb.updateOption({
    _id: order._id
  }, {
    $set: {
      paymentPrice: paymentPrice,
      endDateTime: new Date().getTime(),
      status: enumerate.orderStatus.finish
    }
  }, {})

  await tableDb.updateOption({
    _id: order.tableId
  }, {
    $set: {
      status: enumerate.tableStatus.available,
    }
  })

  return ctx.body = {
    result: true,
    data: null
  }
}