import tableAreaDb from '../db/tableArea'

export let Get = async (ctx) => {
  let query = ctx.query
  await tableAreaDb.find(query).then((resolve) => {
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
  console.log(body)
  await tableAreaDb.insert(body).then((resolve) => {
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
  await tableAreaDb.updateOption({
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
  await tableAreaDb.remove(body).then((resolve) => {
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