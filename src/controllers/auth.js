import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import userDb from '../db/user'
import {
  HttpOk,
  HttpError
} from './httpHelp'

const publicKey = fs.readFileSync(path.join(__dirname, '../../publicKey.pub'))

export let CheckAuth = (ctx) => {
  let token = ctx.request.header.authorization
  try {
    let decoded = jwt.verify(token.substr(7), publicKey)
    if (decoded.userInfo) {
      return {
        status: 1,
        result: decoded.userInfo
      }
    } else {
      return {
        status: 403,
        result: {
          errInfo: '没有授权'
        }
      }
    }
  } catch (err) {
    return {
      status: 503,
      result: {
        errInfo: '解密错误'
      }
    }
  }
}

export let Post = async (ctx) => {
  let {
    phoneNumber,
    password
  } = ctx.request.body

  let user = await userDb.findOne({
    phoneNumber,
    password
  })

  if (!user) {
    HttpError(ctx, "账号或密码错误")
    return
  }

  if (!user.isEnable) {
    HttpError(ctx, "账号已停用")
    return
  }

  let token = jwt.sign({
    userInfo: {
      name: user.name,
      userType: user.userType,
      _id: user._id
    }
  }, publicKey, {
    expiresIn: '7d'
  })

  HttpOk(ctx, token)
  return
}