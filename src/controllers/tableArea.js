import tableAreaDb from '../db/tableArea'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query
  await tableAreaDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Post = async (ctx) => {
  let {
    name
  } = ctx.request.body

  name = (name + "").trim()
  if (name.length == 0) {
    HttpError(ctx, "名称不能为空")
    return
  }

  await tableAreaDb.insert({
    name
  }).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })

}

export let Put = async (ctx) => {
  let _id = ctx.query._id
  let {
    name
  } = ctx.request.body

  name = (name + "").trim()
  if (name.length == 0) {
    HttpError(ctx, "名称不能为空")
    return
  }

  let existSameName = await tableAreaDb.findOne({
    name: name,
    _id: {
      $ne: _id
    }
  })
  if (existSameName) {
    HttpError(ctx, "此名字已被使用")
    return
  }

  await tableAreaDb.updateOption({
    _id: ctx.query._id
  }, {
    name
  }).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await tableAreaDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}