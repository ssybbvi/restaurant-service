import * as productDb from '../db/product'

export let Get = async (ctx) => {
  let query = ctx.query
  await productDb.find(query).then((resolve) => {
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

  await productDb.insert(body).then((resolve) => {
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
  let body = ctx.request.body
  console.log("bodyPut",
    body)
  await productDb.update(body).then((resolve) => {
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
  await productDb.remove(body).then((resolve) => {
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