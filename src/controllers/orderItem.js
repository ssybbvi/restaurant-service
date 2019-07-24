import orderItemDb from '../db/orderItem'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query
  await orderItemDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Post = async (ctx) => {
  let body = ctx.request.body
  await orderItemDb.insert(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })

}

export let Put = async (ctx) => {
  await orderItemDb.updateOption(ctx.query, ctx.request.body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await orderItemDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let setOrderItemSort = async (ctx) => {
  let {
    orderItemSortList
  } = ctx.request.body

  for (let [index, item] of orderItemSortList.entrise()) {
    await orderItemDb.updateOption({
      _id: item._id
    }, {
      sort: index
    })
  }

  HttpOk(ctx, {})
}