import Koa2 from 'koa'
import KoaStatic from 'koa-static2'
import path from 'path'
import fs from 'fs'

const app = new Koa2()
const env = process.env.NODE_ENV || 'development' // Current mode

app
  .use(KoaStatic('/', path.resolve(__dirname, '../cash-register')))
  .use((ctx, next) => {
    console.log("ctx.url", ctx.url)
    if (ctx.url.indexOf(".") === -1) {
      let html = fs.readFileSync(path.join(__dirname, '../cash-register/index.html')).toString()
      return ctx.body = html;
    } else {
      next()
    }
  })

app.listen("9527")

export default app