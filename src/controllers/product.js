import productDb from '../db/product'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query
  await productDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Post = async (ctx) => {
  let body = ctx.request.body

  await productDb.insert(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })

}

export let Put = async (ctx) => {
  await productDb.updateOption({
    _id: ctx.query._id
  }, ctx.request.body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await productDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let setStock = async (ctx) => {
  let {
    productIdWithStockList
  } = ctx.request.body

  for (let item of productIdWithStockList) {
    await productDb.updateOption({
      _id: item._id
    }, {
      stock: item.stock
    })
  }

  HttpOk(ctx, {})
  return
}