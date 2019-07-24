import productTypeDb from '../db/productType'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query
  if (query.type) {
    query.type = Number.parseInt(query.type)
  }
  await productTypeDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Post = async (ctx) => {
  let body = ctx.request.body
  await productTypeDb.insert(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })

}

export let Put = async (ctx) => {
  await productTypeDb.updateOption({
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
  await productTypeDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}