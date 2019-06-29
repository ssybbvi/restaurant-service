import ReamrkDb from '../db/remark'

let remarkDb = new ReamrkDb()

export let Get = async (ctx) => {
  let query = ctx.query
  if (query.type) {
    query.type = Number.parseInt(query.type)
  }
  await remarkDb.find(query).then((resolve) => {
    ctx.body = {
      result: true,
      data: resolve
    }
  }).catch(reject => {
    ctx.body = {
      result: false,
      data: reject
    }
  })
}

export let Post = async (ctx) => {
  let body = ctx.request.body
  await remarkDb.insert(body).then((resolve) => {
    ctx.body = {
      result: true,
      data: resolve
    }
  }).catch(reject => {
    ctx.body = {
      result: false,
      data: reject
    }
  })

}

export let Put = async (ctx) => {
  await remarkDb.updateOption({
    _id: ctx.query._id
  }, ctx.request.body).then((resolve) => {
    ctx.body = {
      result: true,
      data: resolve
    }
  }).catch(reject => {
    ctx.body = {
      result: false,
      data: reject
    }
  })
}

export let Remove = async (ctx) => {
  let body = ctx.request.body
  await remarkDb.remove(body).then((resolve) => {
    ctx.body = {
      result: true,
      data: resolve
    }
  }).catch(reject => {
    ctx.body = {
      result: false,
      data: reject
    }
  })
}