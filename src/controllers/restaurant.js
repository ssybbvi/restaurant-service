import tableAreaDb from '../db/tableArea'
import orderItemDb from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'

import {
  orderStatus,
  productStatus,
  tableStatus,
  orderSource
} from '../services/enumerates'
import {
  HttpOk,
  HttpError
} from './httpHelp'
import {
  getWaitCookQueues,
  loadOrderItemToWaitCookQueues,
  settingGift,
  settingTimeOut,
  settingBale,
  settingDelete,
  draggableItem,
  settingCancelExpedite,
  settingExpedite,
  updateOrderItemTableName
} from '../services/waitCookQueues';

export let openTable = async (ctx) => {
  let {
    tableId,
    seat
  } = ctx.request.body

  let table = await tableDb.findOne({
    _id: tableId
  })
  if (table.status != tableStatus.available) {
    HttpError(ctx, "桌子使用中")
    return
  }

  let order = await orderDb.insert({
    tableId: tableId,
    orderSource: orderSource.cashRegister,
    seat: seat,
    tableName: table.name,
    tableAreaName: table.area.length > 0 ? table.area[0] : "",
    status: orderStatus.processing,
    totalPrice: 0,
    paymentPrice: 0,
    offerPriceItems: [],
    eventItems: []
  })

  await tableDb.updateOption({
    _id: tableId
  }, {
    status: tableStatus.dining,
    startDateTime: Date.now(),
    seat: seat,
    orderId: order._id
  })

  ctx.io.emit("openTable", {})
  HttpOk(ctx, order)
  return
}

export let changeSeat = async (ctx) => {
  let {
    orderId,
    seat
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "订单不存在")
    return
  }

  let table = await tableDb.findOne({
    _id: order.tableId
  })
  if (!table) {
    HttpError(ctx, "桌子不存在")
    return
  }

  await tableDb.updateOption({
    _id: order.tableId
  }, {
    seat: seat
  })

  await orderDb.updateOption({
    _id: orderId
  }, {
    seat: seat
  })

  ctx.io.emit(`orderId:${orderId}`, {})
  ctx.io.emit(`changeSet`, {})
  HttpOk(ctx, {})
  return
}

export let changeTable = async (ctx) => {
  let {
    orderId,
    tableId
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "订单不存在")
    return
  }

  let newTable = await tableDb.findOne({
    _id: tableId
  })
  if (!newTable) {
    HttpError(ctx, "桌子不存在")
    return
  }

  if (newTable.status !== tableStatus.available) {
    HttpError(ctx, "目标桌子不是可用状态")
    return
  }

  let oldTable = await tableDb.findOne({
    _id: order.tableId
  })
  if (!oldTable) {
    HttpError(ctx, "原桌子不存在")
    return
  }

  await tableDb.updateOption({
    _id: oldTable._id
  }, {
    status: tableStatus.available,
    orderId: "",
    startDateTime: 0
  })

  await tableDb.updateOption({
    _id: newTable._id
  }, {
    orderId: order._id,
    status: tableStatus.dining,
    startDateTime: oldTable.startDateTime,
    seat: oldTable.seat,
  })

  await orderDb.updateOption({
    _id: order._id
  }, {
    tableId: newTable._id,
    tableAreaName: newTable.area,
    tableName: newTable.name
  })

  await orderItemDb.updateOption({
    orderId: order._id
  }, {
    tableName: newTable.name
  })

  await updateOrderItemTableName(order._id, newTable.name)

  ctx.io.emit(`orderId:${orderId}`, {})
  ctx.io.emit(`changeTable`, {})
  HttpOk(ctx, {})
}

export let getOrderItem = async (ctx) => {
  let {
    orderId
  } = ctx.query

  let orderItemList = await orderItemDb.find({
    orderId
  }, {
    status: 1,
    endCookDateTime: -1,
    startCookDateTime: 1,
    orderMakeDateTime: -1,
    sort: 1
  })
  HttpOk(ctx, orderItemList)
  return
}

export let insertOrderItem = async (ctx) => {
  let {
    orderId,
    productId,
    name,
    price,
    isGift,
    isTimeout,
    isExpedited,
    isBale,
    remark
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中")
    return
  }

  await orderItemDb.insert({
    orderId,
    productId,
    name,
    price,
    isGift: isGift || false,
    isTimeout: isTimeout || false,
    isExpedited: isExpedited || false,
    isBale: isBale || false,
    remark: remark || "",
    status: productStatus.normal,
    tableName: order.tableName
  })

  ctx.io.emit(`orderId:${orderId}`, {})
  HttpOk(ctx, {})
  return
}

export let setGiftOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  let isGift = !orderItem.isGift
  if (orderItem.status === productStatus.waitCooking) {
    await settingGift(orderItemId, isGift)
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isGift: isGift
  })

  let lastOrderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`setGiftOrderItem`, lastOrderItem)
  HttpOk(ctx, {})
  return
}

export let setTimeOutOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  if (![productStatus.normal].some(s => s === orderItem.status)) {
    HttpError(ctx, "菜品状态必须是未下单到厨房才可以修改状态")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  let isTimeout = !orderItem.isTimeout
  if (orderItem.status === productStatus.waitCooking) {
    await settingTimeOut(orderItemId, isTimeout)
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isTimeout: !orderItem.isTimeout
  })

  let lastOrderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`setTimeOutOrderItem`, lastOrderItem)
  HttpOk(ctx, {})
}

export let setExpediteOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  if (![productStatus.normal, productStatus.waitCooking].some(s => s === orderItem.status)) {
    HttpError(ctx, "菜品状态必须是未下单到厨房和待烹饪状态才可以修改状态")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }
  let isExpedited = !orderItem.isExpedited
  if (orderItem.status === productStatus.waitCooking) {
    await settingDelete(orderItemId) //先删除
    if (isExpedited) { //再按加急排序插入
      await settingExpedite(orderItem)
    } else { //按下单时间排序插入
      await settingCancelExpedite(orderItem)
    }
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isExpedited: isExpedited
  })

  let lastOrderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  ctx.io.emit(`expediteOrderItem`, lastOrderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})

  HttpOk(ctx, {})
}

export let setBaleOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  let isBale = !orderItem.isBale
  if (orderItem.status === productStatus.waitCooking) {
    await settingBale(orderItemId, isBale)
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isBale: isBale
  })

  let lastOrderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  ctx.io.emit(`setBaleOrderItem`, lastOrderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
}

export let setRemarkOrderItem = async (ctx) => {
  let {
    orderItemId,
    remark
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    remark: remark
  })

  ctx.io.emit(`setRemarkOrderItem`, {})
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
  return
}

export let deleteOrderItem = async (ctx) => {
  let {
    orderItemId,
    deleteReamrk
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "菜品不存在")
    return
  }

  if (![productStatus.normal, productStatus.waitCooking, productStatus.cooking].some(s => s === orderItem.status)) {
    HttpError(ctx, "菜品状态必须是未下单到厨房和待烹饪状态才可以修改状态")
    return
  }
  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  if ([productStatus.waitCooking].some(s => s === orderItem.status)) {
    await settingDelete(orderItemId)
  }

  await orderItemDb.remove({
    _id: orderItemId
  })

  await orderDb.updateOption({
    _id: order._id
  }, {
    eventItems: [deleteReamrk || ""]
  })

  ctx.io.emit(`deleteOrderItem`, orderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
  return
}

export let setOrderItemSort = async (ctx) => {
  let {
    orderItemIds,
    orderId
  } = ctx.request.body

  for (let [index, item] of orderItemIds.entries()) {
    await orderItemDb.updateOption({
      _id: item
    }, {
      sort: index
    })
  }

  ctx.io.emit(`orderId:${orderId}`, {})
  HttpOk(ctx, {})
  return
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

  let orderItems = await orderItemDb.find({
    orderId: orderId,
    isTimeout: false,
    status: productStatus.normal
  })

  orderItems.sort((pre, cur) => {
    return pre.isExpedited ? 1 : -1
  })

  for (let item of orderItems) {
    await orderItemDb.updateOption({
      _id: item._id,
    }, {
      status: productStatus.waitCooking,
      orderMakeDateTime: Date.now()
    })
  }

  await loadOrderItemToWaitCookQueues()

  ctx.io.emit(`orderId:${orderId}`, {})
  ctx.io.emit("orderMake", {})
  HttpOk(ctx, {})
  return
}

//拖拽菜品调整队列
export let draggableOrderItem = async (ctx) => {
  let {
    fromChefId,
    toChefId,
    orderItem,
    oldIndex,
    newIndex
  } = ctx.request.body

  if (fromChefId == toChefId && oldIndex == newIndex) {
    HttpOk(ctx, {})
    return
  }

  await draggableItem(fromChefId, toChefId, oldIndex, newIndex, orderItem)

  ctx.io.emit("draggableOrderItem", {})
  HttpOk(ctx, {})
  return
}

//厨师获取待烹饪的菜品 并且更新状态为烹饪中
export let startCookOrderItem = async (ctx) => {
  let {
    userId,
    orderItemId,
  } = ctx.request.body

  let waitCookQueues = getWaitCookQueues()
  let chef = waitCookQueues.chefList.find(f => f._id === userId)
  if (!chef) {
    HttpError(ctx, "炒菜队列中找不到您")
    return
  }

  if (chef.list.length == 0) {
    HttpError(ctx, "您的炒菜队列为空")
    return
  }

  let orderItemIndex = 0
  if (orderItemId) {
    orderItemIndex = chef.list.findIndex(f => f._id === orderItemId)
    if (orderItemIndex < 0) {
      HttpError(ctx, "没有这道菜")
      return
    }
  } else {
    orderItemId = chef.list[orderItemIndex]._id
  }

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "这道菜被删除了")
    return
  }

  if (orderItem.status !== productStatus.waitCooking) {
    HttpError(ctx, "这道菜的状态不是待烹饪")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.cooking,
    startCookDateTime: Date.now(),
    chefId: userId
  })

  await settingDelete(orderItemId)

  ctx.io.emit("startCookOrderItem", orderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
}

//厨师完成烹饪
export let finishOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "没有这道菜")
    return
  }

  if (orderItem.status !== productStatus.cooking) {
    HttpError(ctx, "菜品状态不是烹饪中")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.finish,
    endCookDateTime: Date.now()
  })

  ctx.io.emit(`finishOrderItem`, {})
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
  return
}

//获取队列
export let fetchWaitCookQueues = async (ctx) => {
  HttpOk(ctx, getWaitCookQueues())
  return
}

//厨师获取烹饪中和烹饪完成的菜品
export let fetchCookProductList = async (ctx) => {
  let {
    userId,
    page,
    perPage
  } = ctx.query

  let orderItemList = await orderItemDb.findPageWithSorted({
    chefId: userId,
    status: {
      $in: [
        productStatus.cooking,
        productStatus.finish
      ]
    }
  }, {
    endCookDateTime: 1
  }, page, perPage)

  HttpOk(ctx, orderItemList)
}

export let loadPrepareTransportOrderItem = async (ctx) => {
  let {
    waiterId
  } = ctx.query

  let orderItemList = await orderItemDb.find({
    $or: [{
      status: productStatus.finish
    }, {
      status: productStatus.transporting,
      waiterId: waiterId
    }]

  }, {
    orderMakeDateTime: -1
  })

  HttpOk(ctx, orderItemList)
}

export let loadWaiterTransportOrderItem = async (ctx) => {
  let {
    waiterId,
    page,
    perPage
  } = ctx.query

  let orderItemList = await orderItemDb.find({
    waiterId: waiterId
  })

  // let orderItemList = await orderItemDb.findPageWithSorted({
  //   waiterId: waiterId,
  //   page,
  //   perPage
  // }, {
  //   status: 1,
  //   orderMakeDateTime: -1
  // })

  HttpOk(ctx, orderItemList)
}

export let transportingOrderItem = async (ctx) => {
  let {
    orderItemId,
    waiterId
  } = ctx.request.body

  if (!waiterId) {
    HttpError(ctx, "配送人员id不能为空")
    return
  }

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  if (orderItem.status !== productStatus.finish) {
    HttpError(ctx, "其中有菜品不是待配送状态")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.transporting,
    startTransportDatetime: Date.now(),
    waiterId: waiterId
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`transportingOrderItem`, {})
  return HttpOk(ctx, {})
}

export let cancelTransportOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.finish,
    startTransportDatetime: 0,
    waiterId: "",
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`cancelTransportOrderItem`, {})
  return HttpOk(ctx, {})
}

export let transportedOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDb.findOne({
    _id: orderItemId
  })
  if (orderItem.status !== productStatus.transporting) {
    HttpError(ctx, "其中有菜品不是配送中状态")
    return
  }

  let order = await orderDb.findOne({
    _id: orderItem.orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }
  if (![orderStatus.processing].some(s => s === order.status)) {
    HttpError(ctx, "主订单必须是处理中才可以修改状态")
    return
  }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.transportFinish,
    endTransportDatetime: Date.now()
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`transportedOrderItem`, {})
  return HttpOk(ctx, {})
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
    paymentDateTime: Date.now(),
    remark: remark,
    status: orderStatus.finish,
    totalPrice: totalPrice,
    cashierName,
    cashierUserId
  })

  await tableDb.updateOption({
    orderId: orderId
  }, {
    status: tableStatus.available,
  })

  ctx.io.emit("paymentOrder", {})
  HttpOk(ctx, {})
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

  let orderItems = await orderItemDb.find({
    orderId: orderId
  })

  if (!orderItems.every(s => s.status === productStatus.normal)) {
    HttpError(ctx, "已有菜品下单到厨房了，无法取消")
    return
  }

  await orderDb.updateOption({
    _id: orderId
  }, {
    status: orderStatus.cancel
  })

  await tableDb.updateOption({
    orderId: orderId
  }, {
    status: tableStatus.available,
    orderId: ""
  })

  ctx.io.emit("cancelOrder", {})
  HttpOk(ctx, {})
  return
}