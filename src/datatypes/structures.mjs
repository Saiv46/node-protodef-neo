import { Complex, Countable } from './_shared.mjs'

export class array extends Countable {
  constructor ({ type, ...count }) {
    super(count)
    this.type = this.constructDatatype(type)
  }

  read (buf, ctx) {
    const l = this.readCount(buf)
    const res = []
    for (let i = 0, b = this.sizeReadCount(buf); i < l; i++) {
      const view = buf.slice(b)
      b += this.type.sizeRead(view, ctx)
      res.push(this.type.read(view, ctx))
    }
    return res
  }

  write (buf, val, ctx) {
    const l = val.length
    this.writeCount(buf, l)
    for (let i = 0, b = this.sizeWriteCount(l); i < l; i++) {
      this.type.write(buf.slice(b), val[i], ctx)
      b += this.type.sizeWrite(val[i], ctx)
    }
  }

  sizeRead (buf, ctx) {
    const l = this.readCount(buf)
    let size = this.sizeReadCount(buf)
    for (let i = 0; i < l; i++) {
      size += this.type.sizeRead(buf.slice(size), ctx)
    }
    return size
  }

  sizeWrite (val, ctx) {
    const l = val.length
    let size = this.sizeWriteCount(l)
    for (let i = 0; i < l; i++) {
      size += this.type.sizeWrite(val[i], ctx)
    }
    return size
  }
}

export class count extends Complex {
  constructor ({ countFor, type }) {
    super()
    this.countFor = countFor
    this.type = this.constructDatatype(type)
  }

  read (buf, ctx) {
    const value = this.type.read(buf, ctx)
    ctx.set(this.countFor, value)
    return value
  }

  write (buf, val, ctx) { // TODO: Reimplement
    ctx.set(this.countFor, val)
    this.type.write(buf, val)
  }

  sizeRead (buf, ctx) { return this.type.sizeRead(buf, ctx) }
  sizeWrite (val, ctx) { return this.type.sizeWrite(val, ctx) }
}

const ANONYMOUS_FIELD = Symbol.for('ANONYMOUS_FIELD')
export class container extends Complex {
  constructor (fields) {
    super()
    this.fields = new Map()
    for (const { name, type, anon = false } of fields) {
      this.fields.set(
        anon ? ANONYMOUS_FIELD : name,
        this.constructDatatype(type)
      )
    }
  }

  read (buf, ctx) {
    ctx = ctx.child()
    const res = {}
    let b = 0
    for (const [name, type] of this.fields) {
      const view = buf.slice(b)
      b += type.sizeRead(view, ctx)
      const value = type.read(view, ctx)
      if (name === ANONYMOUS_FIELD) {
        if (typeof value !== 'object') continue
        for (const k in value) {
          res[k] = value[k]
          ctx.set(k, value[k])
        }
        continue
      }
      res[name] = value
      ctx.set(name, value)
    }
    return res
  }

  write (buf, val, ctx) {
    let b = 0
    for (const [name, type] of this.fields) {
      if (name === ANONYMOUS_FIELD) {
        type.write(buf.slice(b, b += type.sizeWrite(val, ctx)), val, ctx)
        for (const k in val) {
          ctx.set(k, val[k])
        }
        continue
      }
      const value = val[name]
      type.write(buf.slice(b, b += type.sizeWrite(value, ctx)), value, ctx)
      ctx.set(name, value)
    }
  }

  sizeRead (buf, ctx) {
    let b = 0
    for (const [name, type] of this.fields) {
      const view = buf.slice(b)
      b += type.sizeRead(view, ctx)
      const value = type.read(view, ctx)
      if (name === ANONYMOUS_FIELD) {
        for (const k in value) {
          ctx.set(k, value[k])
        }
        continue
      }
      ctx.set(name, value)
    }
    return b
  }

  sizeWrite (val, ctx) {
    let b = 0
    for (const [name, type] of this.fields) {
      if (name === ANONYMOUS_FIELD) {
        b += type.sizeWrite(val, ctx)
        for (const k in val) {
          ctx.set(k, val[k])
        }
        continue
      }
      const value = val[name]
      b += type.sizeWrite(value, ctx)
      ctx.set(name, value)
    }
    return b
  }
}
