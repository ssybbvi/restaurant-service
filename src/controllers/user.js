import userDb from '../db/user'
import {
  orderStatus,
  productStatus,
  tableStatus,
  userType
} from '../services/enumerates'
import {
  HttpOk,
  HttpError
} from './httpHelp'
import {
  initWaitCookQueues,
} from '../services/waitCookQueues';

export let Get = async (ctx) => {
  let query = ctx.query

  await userDb.find(query).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}

export let Post = async (ctx) => {
  let {
    name,
    userType,
    phoneNumber,
    password,
    remarks,
    isEnable
  } = ctx.request.body
  name = (name + "").trim()
  if (name.length == 0) {
    HttpError(ctx, "名称不能为空")
    return
  }

  let existName = await userDb.findOne({
    $or: [{
      name,
      phoneNumber
    }]
  })
  if (existName) {
    HttpError(ctx, "这个名字已被使用")
    return
  }
  await userDb.insert({
    name,
    userType,
    phoneNumber,
    password,
    remarks,
    isEnable
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
    userType,
    phoneNumber,
    password,
    remarks,
    isEnable
  } = ctx.request.body

  name = (name + "").trim()
  if (name.length == 0) {
    HttpError(ctx, "名称不能为空")
    return
  }

  let existSameName = await userDb.findOne({
    name: name,
    $or: [{
      name
    }, {
      phoneNumber
    }],
    _id: {
      $ne: _id
    }
  })
  if (existSameName) {
    HttpError(ctx, "此名字已被使用")
    return
  }

  await userDb.updateOption({
    _id
  }, {
    name,
    userType,
    phoneNumber,
    password,
    remarks,
    isEnable
  }).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await userDb.remove(body).then((resolve) => {
    HttpOk(ctx, resolve)
  }).catch(reject => {
    HttpError(ctx, reject)
  })
}

export let getChefProduct = async (ctx) => {
  let {
    userId,
  } = ctx.query

  let chef = await userDb.findOne({
    _id: userId,
    userType: userType.chef
  })
  if (!chef) {
    HttpError(ctx, "没有这个厨师")
    return
  }
  return HttpOk(ctx, chef.extra.likeProductIds || [])
}

export let setChefProduct = async (ctx) => {
  let {
    userId,
    likeProductIds
  } = ctx.request.body

  let chef = await userDb.findOne({
    _id: userId,
    userType: userType.chef
  })
  if (!chef) {
    HttpError(ctx, "没有这个厨师")
    return
  }

  chef.extra.likeProductIds = likeProductIds

  await userDb.updateOption({
    _id: userId,
  }, {
    extra: chef.extra
  })

  initWaitCookQueues()

  ctx.io.emit("setChefProduct", {})
  return HttpOk(ctx, {})
}

export let chefUpdateWork = async (ctx) => {
  let {
    userId,
    isWork
  } = ctx.request.body

  await userDb.updateOption({
    _id: userId
  }, {
    isWork
  })

  initWaitCookQueues()
  ctx.io.emit("chefUpdateWork", {})
  return HttpOk(ctx, {})
}