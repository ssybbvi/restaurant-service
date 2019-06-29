export function HttpOk(ctx, data) {
  ctx.body = {
    result: true,
    data: data
  }
}

export function HttpError(ctx, data) {
  ctx.body = {
    result: false,
    data: data
  }
}