import tableAreaDb from '../db/tableArea'
import orderItemDb from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'
import userDb from '../db/user'

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

//开桌
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
    seatPrice: 2,
    tableName: table.name,
    tableAreaName: table.area.length > 0 ? table.area[0] : "",
    status: orderStatus.processing,
    totalPrice: 0,
    paymentPrice: 0,
    offerList: [],
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

  await saveEventItems(order._id, `开桌 桌号:${table.name} 座位数:${seat}`)

  ctx.io.emit("openTable", {})
  HttpOk(ctx, order)
  return
}

//修改座位数
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

  await saveEventItems(order._id, `修改座位数量${seat}`)

  ctx.io.emit(`orderId:${orderId}`, {})
  ctx.io.emit(`changeSet`, {})
  HttpOk(ctx, {})
  return
}

//换桌
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

  await saveEventItems(order._id, `换桌  新桌号:${newTable.name} `)

  ctx.io.emit(`orderId:${orderId}`, {})
  ctx.io.emit(`changeTable`, {})
  HttpOk(ctx, {})
}

//获得订单列表
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

//新增菜品
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

  await saveEventItems(order._id, `新增菜品 菜品名:${name}`)

  ctx.io.emit(`orderId:${orderId}`, {})
  HttpOk(ctx, {})
  return
}

//设置菜品为赠品
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

  await saveEventItems(order._id, `${isGift?'设置':'取消'}菜品为赠品 菜品名:${orderItem.name}`)

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`setGiftOrderItem`, lastOrderItem)
  HttpOk(ctx, {})
  return
}

//设置菜品暂停
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

  await saveEventItems(order._id, `${isTimeout?'设置':'取消'}暂停菜品 菜品名:${orderItem.name}`)

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`setTimeOutOrderItem`, lastOrderItem)
  HttpOk(ctx, {})
}

//设置加急菜品
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

  await saveEventItems(order._id, `${isExpedited?'设置':'取消'}加急菜品 菜品名:${orderItem.name}`)

  ctx.io.emit(`expediteOrderItem`, lastOrderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})

  HttpOk(ctx, {})
}

//设置菜品为打包
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

  await saveEventItems(order._id, `${isBale?'设置':'取消'}打包菜品 菜品名:${orderItem.name}`)

  ctx.io.emit(`setBaleOrderItem`, lastOrderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
}

//设置订单备注
export let setOrderReamrk = async (ctx) => {
  let {
    orderId,
    remark
  } = ctx.request.body

  let order = await orderDb.findOne({
    _id: orderId
  })
  if (!order) {
    HttpError(ctx, "主订单不存在")
    return
  }

  await orderDb.updateOption({
    _id: orderId
  }, {
    remark: remark
  })

  await saveEventItems(order._id, `设置订单备注:${remark}`)

  ctx.io.emit(`setOrderReamrk`, {})
  ctx.io.emit(`orderId:${orderId}`, {})
  HttpOk(ctx, {})
}

//设置菜品备注
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

  await saveEventItems(order._id, `设置菜品备注 菜品名:${orderItem.name}  备注:${remark}`)

  ctx.io.emit(`setRemarkOrderItem`, {})
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
  return
}

//删除菜品
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

  await saveEventItems(order._id, `删除菜品 菜品名:${orderItem.name}，删除原因:${deleteReamrk}`)

  ctx.io.emit(`deleteOrderItem`, orderItem)
  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  HttpOk(ctx, {})
  return
}

//设置菜品顺序
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

  await saveEventItems(orderId, `调整菜品顺序`)

  ctx.io.emit(`orderId:${orderId}`, {})
  HttpOk(ctx, {})
  return
}

//下单到厨房
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

  await saveEventItems(orderId, `下单到厨房`)

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
    chefId: userId,
    chefName: chef.name
  })

  await settingDelete(orderItemId)

  await saveEventItems(orderItem.orderId, `${chef.name}开始烹饪菜品${orderItem.name}`)

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

  await saveEventItems(orderItem.orderId, `${orderItem.chefName}完成烹饪菜品${orderItem.name}`)

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

//准备配送菜品的列表
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

//配送菜品
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
  // if (![orderStatus.processing].some(s => s === order.status)) {
  //   HttpError(ctx, "主订单必须是处理中才可以修改状态")
  //   return
  // }

  let user = await userDb.findOne({
    _id: waiterId
  })

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.transporting,
    startTransportDatetime: Date.now(),
    waiterId: waiterId,
    waiterName: user.name
  })

  await saveEventItems(orderItem.orderId, `${user.name}开始配送菜品${orderItem.name}`)

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`transportingOrderItem`, {})
  return HttpOk(ctx, {})
}

//取消配送
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
  // if (![orderStatus.processing].some(s => s === order.status)) {
  //   HttpError(ctx, "主订单必须是处理中才可以修改状态")
  //   return
  // }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.finish,
    startTransportDatetime: 0,
    waiterId: "",
    waiterName: ""
  })

  await saveEventItems(orderItem.orderId, `${orderItem.waiterName}取消配送菜品${orderItem.name}`)

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`cancelTransportOrderItem`, {})
  return HttpOk(ctx, {})
}

//配送菜品完毕
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
  // if (![orderStatus.processing].some(s => s === order.status)) {
  //   HttpError(ctx, "主订单必须是处理中才可以修改状态")
  //   return
  // }

  await orderItemDb.updateOption({
    _id: orderItemId
  }, {
    status: productStatus.transportFinish,
    endTransportDatetime: Date.now()
  })

  await saveEventItems(orderItem.orderId, `${orderItem.waiterName}完成配送菜品${orderItem.name}`)

  ctx.io.emit(`orderId:${orderItem.orderId}`, {})
  ctx.io.emit(`transportedOrderItem`, {})
  return HttpOk(ctx, {})
}

//支付订单
export let paymentOrder = async (ctx) => {
  let {
    orderId,
    paymentPrice,
    totalPrice,
    remark,
    cashierName,
    cashierUserId,
    offerList,
    totalOfferPrice,
    paymentType
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
    cashierUserId,
    offerList: offerList,
    totalOfferPrice,
    paymentType
  })

  await tableDb.updateOption({
    orderId: orderId
  }, {
    status: tableStatus.available,
  })

  await saveEventItems(orderId, `支付订单  支付金额:${paymentPrice}  总金额:${totalPrice} 优惠金额:${totalOfferPrice} 支付方式:${paymentType} 备注:${remark}`)

  ctx.io.emit("paymentOrder", {})
  HttpOk(ctx, {})
  return
}

//取消订单
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

  await saveEventItems(orderId, `取消订单`)

  ctx.io.emit("cancelOrder", {})
  HttpOk(ctx, {})
  return
}

//修改订单支付金额
export let updatePayment = async (ctx) => {
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
    _id: orderId
  }, {
    paymentPrice,
    remark
  })

  await saveEventItems(orderId, `修改支付金额和备注  支付金额:${paymentPrice} 备注:${remark}`)

  HttpOk(ctx, {})
}

//保存事件记录
let saveEventItems = async (orderId, content) => {
  let order = await orderDb.findOne({
    _id: orderId
  })

  let eventItems = order.eventItems
  eventItems.push({
    createAt: Date.now(),
    content: content
  })

  await orderDb.updateOption({
    _id: orderId
  }, {
    eventItems: eventItems
  })
}