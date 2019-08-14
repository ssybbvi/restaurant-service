export let tableStatus = {
  available: 1,
  ordering: 2,
  dining: 3,
  clearing: 4
}

export let orderStatus = {
  cancel: 0,
  processing: 1,
  finish: 2
}

export let productStatus = {
  normal: 1,
  waitCooking: 2,
  cooking: 3,
  finish: 4,
  transporting: 5,
  transportFinish: 6
}

export let userType = {
  admin: 0,
  cashier: 1,
  chef: 2,
  waiter: 3
}

export let orderSource = {
  cashRegister: 1
}

export let configs = {
  discountPrice: 1
}

export let paymentType = {
  cash: 1,
  weixin: 2,
  zhifupay: 3
}