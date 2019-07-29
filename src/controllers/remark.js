import remarkDb from '../db/remark'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let query = ctx.query
  if (query.type) {
    query.type = Number.parseInt(query.type)
  }
  await remarkDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Post = async (ctx) => {
  let {
    content,
    type
  } = ctx.request.body
  content = (content + "").trim()
  if (content.length == 0) {
    HttpError(ctx, "不能为空")
    return
  }

  let existContent = await remarkDb.findOne({
    content
  })
  if (existContent) {
    HttpError(ctx, "已有相同")
    return
  }

  await remarkDb.insert({
    content,
    type
  }).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })

}

export let Put = async (ctx) => {
  let {
    content,
    type
  } = ctx.request.body
  let _id = ctx.query._id
  content = (content + "").trim()
  if (content.length == 0) {
    HttpError(ctx, "不能为空")
    return
  }

  let existContent = await remarkDb.findOne({
    content,
    _id: {
      $ne: _id
    }
  })
  if (existContent) {
    HttpError(ctx, "已有相同")
    return
  }

  await remarkDb.updateOption({
    _id
  }, {
    content,
    type
  }).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}

export let Remove = async (ctx) => {
  let {
    _id
  } = ctx.query
  await remarkDb.remove({
    _id
  }).then((resolve) => {
    HttpOk(ctx, resolve)
    return
  }).catch(reject => {
    HttpError(ctx, reject)
    return
  })
}