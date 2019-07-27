import KoaRouter from 'koa-router'
import controllers from '../controllers/index.js'
import KoaStatic from 'koa-static2'
import path from 'path'
import koaSend from 'koa-send'
import fs from 'fs'
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
  .get(`/getDirname`, controllers.api.getDirname)

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

  .get('/productType', controllers.productType.Get)
  .post('/productType', controllers.productType.Post)
  .put('/productType', controllers.productType.Put)
  .delete('/productType', controllers.productType.Remove)

  .get('/order', controllers.order.Get)
  .get('/order/page', controllers.order.GetPage)
  .get('/order/:_id', controllers.order.GetOne)

  .post('/restaurant/opentable', controllers.restaurant.openTable)
  .post('/restaurant/paymentOrder', controllers.restaurant.paymentOrder)
  .put('/restaurant/orderMake', controllers.restaurant.orderMake)
  .put('/restaurant/cancelOrder', controllers.restaurant.cancelOrder)
  .put('/restaurant/setGiftOrderItem', controllers.restaurant.setGiftOrderItem)
  .put('/restaurant/setTimeOutOrderItem', controllers.restaurant.setTimeOutOrderItem)
  .put('/restaurant/setExpediteOrderItem', controllers.restaurant.setExpediteOrderItem)
  .put('/restaurant/setBaleOrderItem', controllers.restaurant.setBaleOrderItem)
  .put('/restaurant/setRemarkOrderItem', controllers.restaurant.setRemarkOrderItem)
  .get("/restaurant/fetchWaitCookQueues", controllers.restaurant.fetchWaitCookQueues)
  .post("/restaurant/startCookOrderItem", controllers.restaurant.startCookOrderItem)
  .post("/restaurant/finishOrderItem", controllers.restaurant.finishOrderItem)
  .put("/restaurant/draggableOrderItem", controllers.restaurant.draggableOrderItem)
  .get("/restaurant/fetchCookProductList", controllers.restaurant.fetchCookProductList)
  .get('/restaurant/getOrderItem', controllers.restaurant.getOrderItem)
  .post('/restaurant/insertOrderItem', controllers.restaurant.insertOrderItem)
  .delete('/restaurant/deleteOrderItem', controllers.restaurant.deleteOrderItem)
  .put("/restaurant/setOrderItemSort", controllers.restaurant.setOrderItemSort)
  .get("/restaurant/loadPrepareTransportOrderItem", controllers.restaurant.loadPrepareTransportOrderItem)
  .get("/restaurant/loadWaiterTransportOrderItem", controllers.restaurant.loadWaiterTransportOrderItem)
  .put('/restaurant/transportingOrderItem', controllers.restaurant.transportingOrderItem)
  .put('/restaurant/cancelTransportOrderItem', controllers.restaurant.cancelTransportOrderItem)
  .put('/restaurant/transportedOrderItem', controllers.restaurant.transportedOrderItem)
module.exports = router