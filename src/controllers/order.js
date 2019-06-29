import OrderItemDb from '../db/orderItem'
import OrderDb from '../db/order'
let orderItemDB = new OrderItemDb()
let orderDb = new OrderDb()

export let GetOne = async (ctx) => {
  let order = await orderDb.findOne(ctx.params)
  let orderItems = await orderItemDB.find({
    orderId: order._id
  })
  order.productItems = orderItems

  ctx.body = {
    result: true,
    data: order
  }

}

export let Get = async (ctx) => {
  let query = ctx.query
  await orderDb.find(query).then((resolve) => {
    ctx.body = {
      result: true,
      data: resolve
    }
  }).catch(reject => {
    ctx.body = {
      result: false,
      data: reject
    }
  })
}