import orderItemDB from '../db/orderItem'
import userDb from '../db/user'
import {
  orderStatus,
  productStatus,
  tableStatus,
  orderSource,
  userType
} from '../services/enumerates'

let waitCookQueues = {
  chefList: []
}

export let getWaitCookQueues = () => {
  return waitCookQueues
}

export let initWaitCookQueues = async () => {
  waitCookQueues.chefList = []

  let chefList = await userDb.find({
    userType: userType.chef,
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

  await loadOrderItemToWaitCookQueues()
}

export let loadOrderItemToWaitCookQueues = async () => {
  let productWaitCookList = await orderItemDB.find({
    status: productStatus.waitCooking
  }, {
    orderMakeDateTime: -1
  })

  productWaitCookList.sort((pre, cur) => {
    return pre.isExpedited ? -1 : 1
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
      continue
    }

    if (pramas.index > -1) {
      waitCookQueues.chefList[pramas.index].list.push(productWaitCookListItem)
    } else {
      waitCookQueues.chefList[0].list.push(productWaitCookListItem)
    }
  }
}

export let settingGift = async (orderItemId, isGift) => {
  for (let item of waitCookQueues.chefList) {
    let index = item.list.findIndex(f => f._id === orderItemId)
    if (index > -1) {
      item.list[index].isGift = isGift
      break
    }
  }
}

export let settingTimeOut = async (orderItemId, isTimeOut) => {
  for (let item of waitCookQueues.chefList) {
    let index = item.list.findIndex(f => f._id === orderItemId)
    if (index > -1) {
      item.list[index].isTimeOut = isTimeOut
      break
    }
  }
}

export let settingCancelExpedite = async (orderItem) => {
  orderItem.isExpedited = false

  let pramas = {
    targetChefIndex: -1,
    orderItemIndex: 9999
  }

  for (let [chefIndex, chefItem] of waitCookQueues.chefList.entries()) {
    if (!chefItem.likeProductIds.some(s => s === orderItem.productId)) {
      continue
    }

    let index = chefItem.list.findIndex(f => f.isExpedited === false && f.orderMakeDateTime > orderItem.orderMakeDateTime)
    if (index === -1) {
      index = chefItem.list.length
    }
    pramas = pramas.orderItemIndex > index ? {
      orderItemIndex: index,
      targetChefIndex: chefIndex
    } : pramas
  }

  if (pramas.targetChefIndex > -1) {
    waitCookQueues.chefList[pramas.targetChefIndex].list.splice(pramas.orderItemIndex, 0, orderItem)
  } else {
    waitCookQueues.chefList[0].list.push(orderItem)
  }
}

export let settingExpedite = async (orderItem) => {
  orderItem.isExpedited = true
  let pramas = {
    index: -1,
    expeditedTotal: 999,
    total: 999
  }

  for (let [chefIndex, chefItem] of waitCookQueues.chefList.entries()) {
    if (!chefItem.likeProductIds.some(s => s === orderItem.productId)) {
      continue
    }
    let expeditedTotal = chefItem.list.reduce((acc, cur) => {
      if (cur.isExpedited) {
        acc += 1
      }
      return acc
    }, 0)

    if (pramas.expeditedTotal > expeditedTotal) {
      pramas = {
        expeditedTotal: expeditedTotal,
        index: chefIndex,
        total: chefItem.list.length
      }
    } else if (pramas.expeditedTotal === expeditedTotal) {
      pramas = chefItem.list.length < pramas.total ? {
        expeditedTotal: expeditedTotal,
        index: chefIndex,
        total: chefItem.list.length
      } : pramas
    } else {

    }
  }

  if (pramas.index > -1) {
    waitCookQueues.chefList[pramas.index].list.splice(pramas.expeditedTotal, 0, orderItem)
  } else {
    waitCookQueues.chefList[0].list.unshift(orderItem)
  }
}

export let settingBale = async (orderItemId, isBale) => {
  for (let item of waitCookQueues.chefList) {
    let index = item.list.findIndex(f => f._id === orderItemId)
    if (index > -1) {
      item.list[index].isBale = isBale
      break
    }
  }
}

export let settingDelete = async (orderItemId) => {
  for (let item of waitCookQueues.chefList) {
    let index = item.list.findIndex(f => f._id === orderItemId)
    if (index > -1) {
      item.list.splice(index, 1)
      break
    }
  }
}

export let draggableItem = async (fromChefId, toChefId, oldIndex, newIndex, orderItem) => {
  let fromChef = waitCookQueues.chefList.find(f => f._id === fromChefId)
  fromChef.list.splice(oldIndex, 1)

  let toChef = waitCookQueues.chefList.find(f => f._id === toChefId)
  toChef.list.splice(newIndex, 0, orderItem)
}

export let updateOrderItemTableName = async (orderId, tableName) => {
  for (let chefItem of waitCookQueues.chefList) {
    let orderItemList = chefItem.list.filter(f => f.orderId === orderId)
    for (let item of orderItemList) {
      item.tableName = tableName
    }
  }
}