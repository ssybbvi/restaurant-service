import productDb from '../db/product'
import productTypeDb from '../db/productType'
import userDb from '../db/user'
import orderItemDb from '../db/orderItem'
import orderDb from '../db/order'
import tableDb from '../db/table'
import tableAreaDb from '../db/tableArea'
import {
  orderStatus,
  productStatus,
  tableStatus,
  orderSource,
  userType
} from '../services/enumerates'
import {
  initWaitCookQueues,
} from '../services/waitCookQueues'

import {
  HttpOk,
  HttpError
} from './httpHelp'
import product from '../db/product';

let gitlabList = []

export let gitlab = (ctx) => {
  let body = ctx.request.body
  gitlabList.push(body)
  ctx.body = gitlabList
}

export let Init = async (ctx) => {

  await orderDb.remove({})

  await tableAreaDb.remove({})
  await tableAreaDb.insert({
    name: "A区域"
  })
  await tableAreaDb.insert({
    name: "B区域"
  })

  await tableDb.remove({})
  await tableDb.insert({
    _id: "table1",
    name: "101",
    area: [],
    status: 1,
    defaultSeat: 4
  })
  await tableDb.insert({
    _id: "table102",
    name: "102",
    area: [],
    status: 1,
    defaultSeat: 4
  })
  await tableDb.insert({
    _id: "table103",
    name: "103",
    area: [],
    status: 1,
    defaultSeat: 4
  })

  await productTypeDb.remove({})

  let shucai = "蔬菜"
  await productTypeDb.insert({
    name: shucai
  })

  let roulei = "肉类"
  await productTypeDb.insert({
    name: roulei
  })

  let tanglei = "汤类"
  await productTypeDb.insert({
    name: tanglei
  })

  await productDb.remove({})

  await productDb.insert({
    _id: "mdcr",
    name: "毛豆炒肉",
    price: 12.5,
    label: [roulei],
    stock: 3
  })

  await productDb.insert({
    _id: "zznr",
    name: "孜然牛肉",
    price: 12.5,
    label: [roulei],
    stock: 2
  })

  await productDb.insert({
    _id: "tdcjk",
    name: "土豆炒鸡块",
    price: 15,
    label: [roulei],
    stock: 2
  })

  await productDb.insert({
    _id: "jyt",
    name: "鲫鱼汤",
    price: 22.5,
    label: [tanglei],
    stock: 2
  })

  await productDb.insert({
    _id: "smcr",
    name: "蒜苗炒肉",
    price: 5,
    label: [roulei],
    stock: 2
  })

  await productDb.insert({
    _id: "jt",
    name: "鸡汤",
    price: 25,
    label: [tanglei, shucai],
    stock: 2
  })

  await productDb.insert({
    _id: "xbc",
    name: "小白菜",
    price: 15,
    label: [shucai],
    stock: 2
  })

  await productDb.insert({
    _id: "dbc",
    name: "大白菜",
    price: 29,
    label: [shucai],
    stock: 2
  })

  await productDb.insert({
    _id: "dy",
    name: "豆芽",
    price: 3,
    label: [shucai],
    stock: 2
  })

  await productDb.insert({
    _id: "pg",
    name: "排骨",
    price: 15,
    label: [shucai],
    stock: 2
  })

  await userDb.remove({})

  await userDb.insert({
    _id: "1",
    name: "厨师1",
    userType: [userType.chef],
    phoneNumber: "1",
    password: "",
    remarks: "",
    isEnable: true,
    isWork: true,
    extra: {
      likeProductIds: ["mdcr", "pg", "jt", "xbc"]
    }
  })

  await userDb.insert({
    _id: "2",
    name: "厨师2",
    userType: [userType.chef],
    phoneNumber: "2",
    password: "",
    remarks: "",
    isEnable: true,
    isWork: true,
    extra: {
      likeProductIds: ["dbc", "pg", "jt", "mdcr"]
    }
  })

  await userDb.insert({
    _id: "11",
    name: "送菜员",
    userType: [userType.waiter],
    phoneNumber: "2",
    password: "",
    remarks: "",
    isEnable: true,
    isWork: true,
    extra: {

    }
  })

  await orderItemDb.remove({})

  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "jt",
  //   "name": "鸡汤",
  //   "price": 25,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "12312",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635066759,
  //   "tableName": "A101"
  // })

  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "jt",
  //   "name": "鸡汤",
  //   "price": 25,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "水电费水电费广告",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635066759,
  //   "tableName": "A101"
  // })

  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "xbc",
  //   "name": "小白菜",
  //   "price": 15,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "哥哥分为五个我个人个人管管",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635068680,
  //   "tableName": "A101"

  // })
  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "pg",
  //   "name": "排骨",
  //   "price": 15,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "分身乏术是否违反违法的事实发生的",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635072318,
  //   "tableName": "A105"
  // })
  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "smcr",
  //   "name": "蒜苗炒肉",
  //   "price": 5,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "水电费桑多瓦尔沃尔夫",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635074595,
  //   "tableName": "A104"
  // })
  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "jyt",
  //   "name": "鲫鱼汤",
  //   "price": 22.5,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "法规和维吾尔文范围",
  //   "status": productStatus.waitCooking,
  //   "createAt": 1563635076781,
  //   "tableName": "A103"
  // })

  // await orderItemDb.insert({
  //   "orderId": "GXMPup2oRPQpxQCW",
  //   "productId": "jyt",
  //   "name": "鲫鱼汤",
  //   "price": 22.5,
  //   "isGift": false,
  //   "isTimeout": false,
  //   "isExpedited": false,
  //   "isBale": false,
  //   "isDelete": false,
  //   "remark": "水电费示范区而微软沃尔沃",
  //   "status": productStatus.finish,
  //   "createAt": 1563635076781,
  //   "chefId": "1",
  //   "startCookDateTime": 1563635076781,
  //   "endCookDateTime": 1563635076782,
  //   "tableName": "A102"
  // })

  initWaitCookQueues()
  HttpOk(ctx, "")
}