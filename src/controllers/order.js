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
  return
}

export let Get = async (ctx) => {
  let query = ctx.query
  await orderDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let GetPage = async (ctx) => {
  let {
    cashierUserId,
    page,
    perPage
  } = ctx.query

  let search = {}
  if (cashierUserId) {
    search = {
      cashierUserId
    }
  }

  let list = await orderDb.findPageWithSorted(search, "createAt", page, perPage)
  let total = await orderDb.count(search)

  HttpOk(ctx, {
    list,
    total
  })
}