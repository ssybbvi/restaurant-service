import KoaRouter from 'koa-router'
import controllers from '../controllers/index.js'

const router = new KoaRouter()

router
  .get('/public/get', function (ctx, next) {
    ctx.body = '禁止访问！'
  }) // 以/public开头则不用经过权限认证
  .all('/upload', controllers.upload.default)
  .post('/api/init', controllers.api.Init)
  .get('/api/:name', controllers.api.Get)
  .post('/api/:name', controllers.api.Post)
  .put('/api/:name', controllers.api.Put)
  .del('/api/:name', controllers.api.Delect)
  .post('/auth/login', controllers.auth.Post)

  .get('/table', controllers.table.Get)
  .post('/table', controllers.table.Post)
  .put('/table', controllers.table.Put)
  .delete('/table', controllers.table.Remove)

  .get('/user', controllers.user.Get)
  .post('/user', controllers.user.Post)
  .put('/user', controllers.user.Put)
  .delete('/user', controllers.user.Remove)
  .post('/user/setChefProduct', controllers.user.setChefProduct)
  .post('/user/chefUpdateWork', controllers.user.chefUpdateWork)
  .get('/user/getChefProduct', controllers.user.getChefProduct)

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
  .post('/product/setStock', controllers.product.setStock)

  .get('/orderItem', controllers.orderItem.Get)
  .post('/orderItem', controllers.orderItem.Post)
  .put('/orderItem', controllers.orderItem.Put)
  .delete('/orderItem', controllers.orderItem.Remove)

  .get('/productType', controllers.productType.Get)
  .post('/productType', controllers.productType.Post)
  .put('/productType', controllers.productType.Put)
  .delete('/productType', controllers.productType.Remove)

  .get('/order', controllers.order.Get)
  .get('/order/page', controllers.order.GetPage)
  .get('/order/:_id', controllers.order.GetOne)

  .post('/opentable', controllers.restaurant.OpenTable)
  .post('/paymentOrder', controllers.restaurant.paymentOrder)
  .put('/orderMake', controllers.restaurant.orderMake)
  .put('/cancelOrder', controllers.restaurant.cancelOrder)

  .post('/scheduling/initWaitCookQueues', controllers.scheduling.initWaitCookQueues)
  .post("/scheduling/loadOrderItemToWaitCookQueues", controllers.scheduling.loadOrderItemToWaitCookQueues)
  .get("/scheduling/fetchWaitCookQueues", controllers.scheduling.fetchWaitCookQueues)
  .post("/scheduling/startCookOrderItem", controllers.scheduling.startCookOrderItem)
  .post("/scheduling/finishOrderItem", controllers.scheduling.finishOrderItem)
  .post("/scheduling/draggableOrderItem", controllers.scheduling.draggableOrderItem)
  .post("/scheduling/deleteWaitCookQueueChefOrderItem", controllers.scheduling.deleteWaitCookQueueChefOrderItem)
  .get("/scheduling/fetchCookProductList", controllers.scheduling.fetchCookProductList)

module.exports = router