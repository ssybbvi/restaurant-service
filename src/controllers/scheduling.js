import tableAreaDb from '../db/tableArea'
import orderItemDB from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'
import enumerate from '../db/enumerate'
import userDb from '../db/user'

import {
  HttpOk,
  HttpError
} from './httpHelp'

let waitCookQueues = {
  chefList: []
}

//厨师获取待烹饪的菜品 并且更新状态为烹饪中
export let startCookOrderItem = async (ctx) => {
  let {
    userId,
    orderItemId,
  } = ctx.request.body

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
    orderItemIndex = chef.list.findIndex(f => f._id == orderItemId)
    if (orderItemIndex < 0) {
      HttpError(ctx, "没有这道菜")
      return
    }
  }

  await orderItemDB.updateOption({
    _id: chef.list[orderItemIndex]._id
  }, {
    status: enumerate.productStatus.cooking,
    startCookDateTime: Date.now(),
    chefId: userId
  })

  chef.list.splice(orderItemIndex, 1)

  ctx.io.emit("orderItemQueue", waitCookQueues)
  HttpOk(ctx, {})
}

//厨师完成烹饪
export let finishOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body

  let orderItem = await orderItemDB.findOne({
    _id: orderItemId
  })
  if (!orderItem) {
    HttpError(ctx, "没有这道菜")
    return
  }

  if (orderItem.status !== enumerate.productStatus.cooking) {
    HttpError(ctx, "菜品状态不是烹饪中")
    return
  }

  await orderItemDB.updateOption({
    _id: orderItemId
  }, {
    status: enumerate.productStatus.finish,
    endCookDateTime: Date.now()
  })

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

  let fromChef = waitCookQueues.chefList.find(f => f._id === fromChefId)
  fromChef.list.splice(oldIndex, 1)

  let toChef = waitCookQueues.chefList.find(f => f._id === toChefId)
  toChef.list.splice(newIndex, 0, orderItem)

  ctx.io.emit("orderItemQueue", waitCookQueues)
  HttpOk(ctx, {})
  return
}

//获取队列
export let fetchWaitCookQueues = async (ctx) => {
  await _loadOrderItemToWaitCookQueues()
  HttpOk(ctx, waitCookQueues)
}

//删除队列中的菜品
export let deleteWaitCookQueueChefOrderItem = async (ctx) => {
  let {
    orderItemId
  } = ctx.request.body
  for (let item of waitCookQueues.chefList) {
    let index = item.list.findIndex(f => f._id === orderItemId)
    if (index > -1) {
      item.list.splice(index, 1)
    }
  }

  ctx.io.emit("orderItemQueue", waitCookQueues)
  HttpOk(ctx, {})
  return
}

export let initWaitCookQueues = async (ctx) => {
  await _initWaitCookQueues()
  ctx.io.emit("orderItemQueue", waitCookQueues)
  return HttpOk(ctx, {})
}

let _initWaitCookQueues = async () => {
  waitCookQueues.chefList = []

  let chefList = await userDb.find({
    userType: enumerate.userType.chef,
    isWork: true
  })

  waitCookQueues.chefList = chefList.map(item => {
    return {
      _id: item._id,
      name: item.name,
      list: [],
      likeProductIds: item.extra.likeProductIds || [],
    }
  })

  waitCookQueues.chefList.unshift({
    _id: "other",
    name: "待分配",
    list: [],
    likeProductIds: [],
  })

  await _loadOrderItemToWaitCookQueues()
}

//加载新的待烹饪菜品到队列
export let loadOrderItemToWaitCookQueues = async (ctx) => {
  await _loadOrderItemToWaitCookQueues()
  ctx.io.emit("orderItemQueue", waitCookQueues)
  HttpOk(ctx, {})
}

let _loadOrderItemToWaitCookQueues = async () => {
  if (waitCookQueues.chefList.length == 0) {
    await _initWaitCookQueues()
    return
  }

  let productWaitCookList = await orderItemDB.find({
    status: enumerate.productStatus.waitCooking
  }, {
    isTimeout: -1,
    orderMakeDateTime: -1
  })

  for (let productWaitCookListItem of productWaitCookList) {

    let pramas = {
      index: -1,
      total: 9999,
      isExist: false
    }

    for (let [chefItemIndex, chefItem] of waitCookQueues.chefList.entries()) {
      if (chefItem.list.some(s => s._id === productWaitCookListItem._id)) {
        pramas.isExist = true
        break
      }

      if (!chefItem.likeProductIds.some(s => s === productWaitCookListItem.productId)) {
        continue
      }

      pramas =
        chefItem.list.length <= pramas.total ? {
          index: chefItemIndex,
          total: chefItem.list.length
        } : pramas
    }

    if (pramas.isExist) {
      break
    }

    if (pramas.index > -1) {
      waitCookQueues.chefList[pramas.index].list.push(productWaitCookListItem)
    } else {
      waitCookQueues.chefList[0].list.push(productWaitCookListItem)
    }
  }
}

//厨师获取烹饪中和烹饪完成的菜品
export let fetchCookProductList = async (ctx) => {
  let {
    userId,
    page,
    perPage
  } = ctx.query

  let orderItemList = await orderItemDB.findPageWithSorted({
    chefId: userId,
    status: {
      $in: [
        enumerate.productStatus.cooking,
        enumerate.productStatus.finish
      ]
    }
  }, {
    startCookDateTime: -1
  }, page, perPage)

  HttpOk(ctx, orderItemList)
}