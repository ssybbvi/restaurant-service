import KoaRouter from 'koa-router'
import controllers from '../controllers/index.js'

const router = new KoaRouter()

router
  .get('/public/get', function (ctx, next) {
    ctx.body = '禁止访问！'
  }) // 以/public开头则不用经过权限认证
  .all('/upload', controllers.upload.default)
  .get('/api/:name', controllers.api.Get)
  .post('/api/:name', controllers.api.Post)
  .put('/api/:name', controllers.api.Put)
  .del('/api/:name', controllers.api.Delect)
  .post('/auth/:action', controllers.auth.Post)

  .get('/table', controllers.table.Get)
  .post('/table', controllers.table.Post)
  .put('/table', controllers.table.Put)
  .delete('/table', controllers.table.Remove)

  .get('/tableArea', controllers.tableArea.Get)
  .post('/tableArea', controllers.tableArea.Post)
  .put('/tableArea', controllers.tableArea.Put)
  .delete('/tableArea', controllers.tableArea.Remove)

  .get('/product', controllers.product.Get)
  .post('/product', controllers.product.Post)
  .put('/product', controllers.product.Put)
  .delete('/product', controllers.product.Remove)

  .get('/order', controllers.order.Get)
  .get('/order/:_id', controllers.order.GetOne)
  .post('/order', controllers.order.Post)
  .put('/order', controllers.order.Put)
  .delete('/order', controllers.order.Remove)

  .post('/opentable', controllers.restaurant.OpenTable)
  .put('/updateOrderProduct', controllers.restaurant.updateOrderProduct)
  .put('/paymentOrder', controllers.restaurant.paymentOrder)
module.exports = router