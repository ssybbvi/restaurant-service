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
  console.log("OpenTable", ctx.request.body)

  let table = await tableDb.findOne({
    _id: tableId
  })

  console.log("table", table)

  if (table.status != enumerate.tableStatus.available) {
    HttpError(ctx, "桌子使用中")
    return
  }

  let order = await orderDb.insert({
    startDateTime: Date.now,
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
    $set: {
      status: enumerate.tableStatus.dining,
      startDateTime: new Date().getTime(),
      seat: seat,
      orderId: order._id
    }
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
    HttpError(ctx, "无此订单")
    return
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
  })

  let xx = await tableDb.updateOption({
    orderId: orderId
  }, {
    $set: {
      status: enumerate.tableStatus.available,
    }
  })
  console.log("xx", xx)

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
    $set: {
      status: enumerate.tableStatus.available,
    }
  })

  HttpOk(ctx, null)
}

export let debugOrder = async (ctx) => {
  let {
    _id
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: _id
  })
  if (!order) {
    HttpError(ctx, "无此订单")
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

  HttpOk(ctx, null)
}