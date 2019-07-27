import tableAreaDb from '../db/tableArea'
import orderItemDb from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'

import {
  orderStatus,
  productStatus,
  tableStatus
} from '../services/enumerates'
import {
  HttpOk,
  HttpError
} from './httpHelp'
import {
  initWaitCookQueues,
  getWaitCookQueues,
  setWaitCookQueues,
  loadOrderItemToWaitCookQueues
} from '../services/waitCookQueues';

//下单中
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

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isGift: !orderItem.isGift
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
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

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isTimeout: !orderItem.isTimeout
  })

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
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

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isExpedited: !orderItem.isExpedited
  })

  ctx.io.emit(`expediteOrderItem`, {})
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

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    isBale: !orderItem.isBale
  })

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
    let waitCookQueues = getWaitCookQueues()
    for (let item of waitCookQueues.chefList) {
      let index = item.list.findIndex(f => f._id === orderItemId)
      if (index > -1) {
        item.list.splice(index, 1)
        break
      }
    }
    setWaitCookQueues(waitCookQueues)
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
    orderId: orderId
  })
  for (let index = 0; index < orderItems.length; index++) {
    const item = orderItems[index];
    if (item.status === productStatus.normal && item.isTimeout === false) {
      await orderItemDb.updateOption({
        _id: item._id,
      }, {
        status: productStatus.waitCooking,
        orderMakeDateTime: Date.now()
      })
    }
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

  let waitCookQueues = getWaitCookQueues()

  let fromChef = waitCookQueues.chefList.find(f => f._id === fromChefId)
  fromChef.list.splice(oldIndex, 1)

  let toChef = waitCookQueues.chefList.find(f => f._id === toChefId)
  toChef.list.splice(newIndex, 0, orderItem)

  setWaitCookQueues(waitCookQueues)

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
  }

  let orderItem = await orderItemDb.findOne({
    _id: chef.list[orderItemIndex]._id
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

  chef.list.splice(orderItemIndex, 1)

  setWaitCookQueues(waitCookQueues)

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
    endDateTime: Date.now(),
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
    $or: [{
      status: productStatus.finish
    }, {
      status: productStatus.cooking
    }]
  })

  if (orderItems) {
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
  })

  HttpOk(ctx, {})
  return
}