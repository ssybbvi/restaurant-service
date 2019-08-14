import configsDb from '../db/configs'
import {
  HttpOk,
  HttpError
} from './httpHelp'

export let Get = async (ctx) => {
  let {
    key
  } = ctx.query
  let result = await configsDb.findOne({
    key
  })
  HttpOk(ctx, result)
}

export let Put = async (ctx) => {
  let _id = ctx.query._id
  let {
    key,
    value,
  } = ctx.request.body

  key = (key + "").trim()
  if (key.length == 0) {
    HttpError(ctx, "key不能为空")
    return
  }

  let existSameKey = await configsDb.findOne({
    key
  })
  if (existSameKey) {
    await configsDb.updateOption({
      key
    }, {
      value
    })
  } else {
    await configsDb.insert({
      key,
      value
    })
  }

  HttpOk(ctx, {})
}