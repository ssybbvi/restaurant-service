import Koa2 from 'koa'
import KoaBody from 'koa-body'
import KoaStatic from 'koa-static2'
import {
  System as SystemConfig
} from './config'
import path from 'path'
import MainRoutes from './routes/main-routes'
import ErrorRoutesCatch from './middleware/ErrorRoutesCatch'
import ErrorRoutes from './routes/error-routes'
import jwt from 'koa-jwt'
import fs from 'fs'
import http from 'http'
import socket from 'socket.io'
import {
  initWaitCookQueues,
} from './services/waitCookQueues'
initWaitCookQueues()
// import PluginLoader from './lib/PluginLoader'

const app = new Koa2()
const env = process.env.NODE_ENV || 'development' // Current mode

const publicKey = fs.readFileSync(path.join(__dirname, '../publicKey.pub'))

app
  .use((ctx, next) => {
    // if (ctx.request.header.host.split(':')[0] === 'localhost' || ctx.request.header.host.split(':')[0] === '127.0.0.1') {
    //   ctx.set('Access-Control-Allow-Origin', '*')
    // } else {
    //   ctx.set('Access-Control-Allow-Origin', SystemConfig.HTTP_server_host)
    // }

    ctx.set('Access-Control-Expose-Headers', 'Access-Control-*')
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Headers', 'Access-Control-*, Origin, X-Requested-With, Content-Type, Accept,Authorization')
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    ctx.set('Access-Control-Allow-Credentials', true) // 允许带上 cookie
    return next()
  })
  .use(ErrorRoutesCatch())
  .use(KoaStatic('assets', path.resolve(__dirname, '../assets'))) // Static resource
  //.use(jwt({ secret: publicKey }).unless({ path: [/^\/public|\/user\/login|\/assets/] }))
  .use(KoaBody({
    multipart: true,
    parsedMethods: ['POST', 'PUT', 'PATCH', 'GET', 'HEAD', 'DELETE'], // parse GET, HEAD, DELETE requests
    formidable: {
      uploadDir: path.join(__dirname, '../assets/uploads/tmp')
    },
    jsonLimit: '10mb',
    formLimit: '10mb',
    textLimit: '10mb'
  })) // Processing request
  // .use(PluginLoader(SystemConfig.System_plugin_path))
  //.use(MainRoutes.routes())
  .use(MainRoutes.routes())
  .use(MainRoutes.allowedMethods())
  .use(ErrorRoutes())

if (env === 'development') { // logger
  app.use((ctx, next) => {
    return next().then(() => {
      console.log(`${ctx.method} ${ctx.url} -${JSON.stringify(ctx.request.body) }  `)
    })
  })
}

const server = http.createServer(app.callback());
const io = socket(server);
app.context.io = io

server.listen(SystemConfig.API_server_port);

//app.listen(SystemConfig.API_server_port)

console.log('Now start API server on port ' + SystemConfig.API_server_port + '...')

export default app