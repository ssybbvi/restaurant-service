import tableAreaDb from '../db/tableArea'
import orderItemDB from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'
import enumerate from '../db/enumerate'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let OpenTable = async (ctx) => {
  let {
    tableId,
    seat
  } = ctx.request.body

  let table = await tableDb.findOne({
    _id: tableId
  })
  if (table.status != enumerate.tableStatus.available) {
    HttpError(ctx, "桌子使用中")
    return
  }

  let order = await orderDb.insert({
    tableName: table.name,
    tableAreaName: table.area,
    status: enumerate.orderStatus.processing,
    totalPrice: 0,
    paymentPrice: 0,
    offerPriceItems: [],
    eventItems: []
  })

  await tableDb.updateOption({
    _id: tableId
  }, {
    status: enumerate.tableStatus.dining,
    startDateTime: Date.now(),
    seat: seat,
    orderId: order._id
  })

  HttpOk(ctx, order)
}

export let orderMake = async (ctx) => {
  let {
    orderId
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "无此订单")
    return
  }

  let orderItems = await orderItemDB.find({
    orderId: orderId
  })
  for (let index = 0; index < orderItems.length; index++) {
    const item = orderItems[index];
    if (item.status === enumerate.productStatus.normal && item.isTimeout === false) {
      await orderItemDB.updateOption({
        _id: item._id,
      }, {
        status: enumerate.productStatus.waitCooking,
        orderMakeDateTime: Date.now()
      })
    }
  }

  HttpOk(ctx, {})
  return
}

export let paymentOrder = async (ctx) => {
  let {
    orderId,
    paymentPrice,
    totalPrice,
    remark,
    cashierName,
    cashierUserId
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "无此订单")
    return
  }

  await orderDb.updateOption({
    _id: order._id
  }, {
    paymentPrice: paymentPrice,
    endDateTime: Date.now(),
    remark: remark,
    status: enumerate.orderStatus.finish,
    totalPrice: totalPrice,
    cashierName,
    cashierUserId
  })

  await tableDb.updateOption({
    orderId: orderId
  }, {
    status: enumerate.tableStatus.available,
  })

  HttpOk(ctx, null)
  return
}

export let cancelOrder = async (ctx) => {
  let {
    orderId,
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "无此订单")
    return
  }

  let orderItems = await orderItemDB.find({
    $or: [{
      status: enumerate.productStatus.finish
    }, {
      status: enumerate.productStatus.cooking
    }]
  })

  if (orderItems) {
    HttpError(ctx, "已有菜品下单到厨房了，无法取消")
    return
  }

  await orderDb.updateOption({
    _id: orderId
  }, {
    status: enumerate.orderStatus.cancel
  })

  await tableDb.updateOption({
    orderId: orderId
  }, {
    status: enumerate.tableStatus.available,
  })

  HttpOk(ctx, null)
}