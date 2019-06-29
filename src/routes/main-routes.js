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

  .get('/remark', controllers.remark.Get)
  .post('/remark', controllers.remark.Post)
  .put('/remark', controllers.remark.Put)
  .delete('/remark', controllers.remark.Remove)

  .get('/tableArea', controllers.tableArea.Get)
  .post('/tableArea', controllers.tableArea.Post)
  .put('/tableArea', controllers.tableArea.Put)
  .delete('/tableArea', controllers.tableArea.Remove)

  .get('/product', controllers.product.Get)
  .post('/product', controllers.product.Post)
  .put('/product', controllers.product.Put)
  .delete('/product', controllers.product.Remove)

  .get('/orderItem', controllers.orderItem.Get)
  .post('/orderItem', controllers.orderItem.Post)
  .put('/orderItem', controllers.orderItem.Put)
  .delete('/orderItem', controllers.orderItem.Remove)

  .get('/productType', controllers.productType.Get)
  .post('/productType', controllers.productType.Post)
  .put('/productType', controllers.productType.Put)
  .delete('/productType', controllers.productType.Remove)

  .get('/order', controllers.order.Get)
  .get('/order/:_id', controllers.order.GetOne)

  .post('/opentable', controllers.restaurant.OpenTable)
  .post('/paymentOrder', controllers.restaurant.paymentOrder)
  .delete('/debugOrder', controllers.restaurant.debugOrder)
  .put('/orderMake', controllers.restaurant.orderMake)
module.exports = router