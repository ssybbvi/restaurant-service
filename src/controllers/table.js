import tableDb from '../db/table'
import enumerate from '../db/enumerate'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query

  await tableDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}

export let Post = async (ctx) => {
  let {
    name,
    area,
    defaultSeat
  } = ctx.request.body
  name = (name + "").trim()
  if (name.length == 0) {
    HttpError(ctx, "名称不能为空")
    return
  }
  let status = enumerate.tableStatus.available

  let existName = await tableDb.findOne({
    name: name
  })
  if (existName) {
    HttpError(ctx, "这个名字已被使用")
    return
  }
  await tableDb.insert({
    name,
    area,
    defaultSeat,
    status
  }).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })

}

export let Put = async (ctx) => {
  await tableDb.updateOption({
    _id: ctx.query._id
  }, ctx.request.body).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await tableDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}