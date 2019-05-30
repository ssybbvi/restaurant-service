import * as tableDb from '../db/table'
import * as orderDb from '../db/order'
import * as productDb from '../db/product'
import enumerate from '../db/enumerate'
import * as Common from '../tool/Common'

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
  let tableArea = await tableDb.findOne({
    _id: table.areaId
  })

  let order = await orderDb.insert({
    startDateTime: new Date().getTime(),
    tableId: tableId,
    tableName: table.name,
    tableAreaName: tableArea && tableArea.name || "暂无",
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

  return ctx.body = {
    result: true,
    data: "这个方法作废"
  }
}

export let editOrderProduectItems = async (ctx) => {
  let {
    _id,
    productItems
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

  let newProductItems = []
  for (let index = 0; index < productItems.length; index++) {
    const item = productItems[index];
    if (item.isDelete) {
      continue
    }
    let product = await productDb.findOne({
      _id: item.productId
    })
    if (!product) {
      return ctx.body = {
        result: false,
        data: `无此菜品 productId=${item.productId}`
      }
    }

    let productItem = {
      productId: item.productId,
      isGift: item.isGift,
      isTimeout: item.isTimeout,
      isExpedited: item.isExpedited,
      isBale: item.isBale,
      remark: item.remark,
      name: product.name,
      price: product.price,
      _id: item._id || Common.uid(),
      status: item.status,
      isDelete: false
    }
    newProductItems.push(productItem)
  }
  let totalPrice = newProductItems.reduce((total, current) => {
    total += current.price
    return total
  }, 0)
  let paymentPrice = totalPrice

  await orderDb.updateOption({
    _id: _id
  }, {
    $set: {
      productItems: newProductItems,
      totalPrice: totalPrice,
      paymentPrice: paymentPrice
    }
  }, {})

  let lastOrder = await orderDb.findOne({
    _id: _id
  })

  return ctx.body = {
    result: true,
    data: lastOrder
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

  for (let index = 0; index < order.productItems.length; index++) {
    let item = order.productItems[index]
    if (item.status == enumerate.productStatus.normal && item.isTimeout === false) {
      item.status = enumerate.productStatus.cooking
    }
  }

  await orderDb.updateOption({
    _id: orderId
  }, {
    $set: {
      productItems: order.productItems
    }
  }, {})

  let lastOrder = await orderDb.findOne({
    _id: orderId
  })

  return ctx.body = {
    result: true,
    data: lastOrder
  }
}

export let paymentOrder = async (ctx) => {
  let {
    orderId,
    paymentPrice
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