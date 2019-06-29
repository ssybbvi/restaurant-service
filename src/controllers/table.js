import TableDb from '../db/table'

let tableDb = new TableDb()

export let Get = async (ctx) => {
  let query = ctx.query

  await tableDb.find(query).then((resolve) => {
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
  body.status = 1
  await tableDb.insert(body).then((resolve) => {
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
  await tableDb.updateOption({
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
  await tableDb.remove(body).then((resolve) => {
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