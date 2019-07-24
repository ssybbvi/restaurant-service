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

  area = (area + "").trim()
  if (area.length == 0) {
    HttpError(ctx, "区域不能为空")
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
  let _id = ctx.query._id
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

  area = (area + "").trim()
  if (area.length == 0) {
    HttpError(ctx, "区域不能为空")
    return
  }

  let existSameName = await tableDb.findOne({
    name: name,
    _id: {
      $ne: _id
    }
  })
  if (existSameName) {
    HttpError(ctx, "此名字已被使用")
    return
  }

  await tableDb.updateOption({
    _id
  }, {
    name,
    area,
    defaultSeat
  }).then((resolve) => {
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