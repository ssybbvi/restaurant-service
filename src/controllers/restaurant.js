import TableAreaDb from '../db/tableArea'
import OrderItemDb from '../db/orderItem'
import OrderDb from '../db/order'
import TableDb from '../db/table'

let tableDb = new TableDb()
let orderItemDB = new OrderItemDb()
let orderDb = new OrderDb()
let tableAreaDb = new TableAreaDb()

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
  let tableArea = await tableAreaDb.findOne({
    _id: table.areaId
  })

  let order = await orderDb.insert({
    startDateTime: new Date().getTime(),
    tableName: table.name,
    tableAreaName: tableArea && tableArea.name || "暂无",
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

export let orderMake = async (ctx) => {
  let {
    orderId
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    return ctx.body = {
      result: false,
      data: "无此订单"
    }
  }

  let orderItems = await orderItemDB.find({
    orderId: orderId
  })
  for (let index = 0; index < orderItems.length; index++) {
    const item = orderItems[index];
    if (item.status == enumerate.productStatus.normal && item.isTimeout === false) {
      await orderItemDB.updateOption({
        _id: item._id,
      }, {
        $set: {
          status: enumerate.productStatus.cooking
        }
      })
    }
  }

  return ctx.body = {
    result: true,
  }
}

export let paymentOrder = async (ctx) => {
  let {
    orderId,
    paymentPrice,
    remark
  } = ctx.request.body

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
      remark: remark,
      status: enumerate.orderStatus.finish
    }
  }, {})

  await tableDb.updateOption({
    orderId: orderId
  }, {
    $set: {
      status: enumerate.tableStatus.available,
    }
  })

  ctx.body = {
    result: true,
    data: null
  }
  return
}

export let debugOrder = async (ctx) => {
  let {
    _id
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: _id
  })
  if (!order) {
    return ctx.body = {
      result: false,
      data: "无此订单"
    }
  }

  await orderDb.remove({
    _id: order._id
  })

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