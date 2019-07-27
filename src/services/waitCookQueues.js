import orderItemDB from '../db/orderItem'
import enumerate from '../db/enumerate'
import userDb from '../db/user'

let waitCookQueues = {
  chefList: []
}

export let getWaitCookQueues = () => {
  return waitCookQueues
}

export let setWaitCookQueues = (data) => {
  waitCookQueues = data
}

export let initWaitCookQueues = async () => {
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

  await loadOrderItemToWaitCookQueues()
}

export let loadOrderItemToWaitCookQueues = async () => {
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