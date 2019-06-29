import orderDb from '../db/order'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let GetOne = async (ctx) => {
  let {
    _id
  } = ctx.params

  let order = await orderDb.findOne({
    _id
  })

  if (!order) {
    HttpError(ctx, "无此订单")
    return
  }

  HttpOk(ctx, order)
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