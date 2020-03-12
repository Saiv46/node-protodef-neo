import { Complex, Countable } from './_shared.mjs'

export class array extends Countable {
  static get type () { return Array }
  constructor ({ type, ...count }, context) {
    super(count, context)
    this.type = this.constructDatatype(type)
  }

  read (buf) {
    const res = []
    const len = this.readCount(buf)
    for (let i = 0, b = this.sizeReadCount(buf); i < len; i++) {
      res.push(this.type.read(buf.slice(b, b += this.type.sizeRead(buf.slice(b)))))
    }
    return res
  }

  write (buf, val) {
    const l = val.length
    this.writeCount(buf, l)
    for (let i = 0, b = this.sizeWriteCount(l); i < l; i++) {
      this.type.write(buf.slice(b, b += this.type.sizeWrite(val[i])), val[i])
    }
  }

  sizeRead (buf) {
    let size = this.sizeReadCount(buf)
    for (let i = 0, l = this.readCount(buf); i < l; i++) {
      size += this.type.sizeRead(buf.slice(size))
    }
    return size
  }

  sizeWrite (val) {
    let size = this.sizeWriteCount(val.length)
    for (const v of val) {
      size += this.type.sizeWrite(v)
    }
    return size
  }
}

export class count extends Complex {
  constructor ({ countFor, type }, context) {
    super(context)
    this.countFor = countFor
    this.type = this.constructDatatype(type)
  }

  read (buf) { return this.type.read(buf) }
  write (buf, val) { // TODO: Reimplement
    this.context.set(this.countFor, val)
    this.type.write(buf, val)
  }

  sizeRead (buf) { return this.type.sizeRead(buf) }
  sizeWrite (val) { return this.type.sizeWrite(val) }
}

export class container extends Complex {
  static get type () { return Object }
  constructor (fields, context) {
    super(context)
    this.fields = fields.map(v => (
      [v.name, this.constructDatatype(v.type)]
    ))
  }

  read (buf) {
    const res = {}
    let b = 0
    for (const [name, type] of this.fields) {
      const value = type.read(buf.slice(b, b += type.sizeRead(buf.slice(b))))
      this.context.set(name, value)
      res[name] = value
    }
    return res
  }

  write (buf, val) {
    let b = 0
    for (const [name, type] of this.fields) {
      const value = val[name]
      type.write(buf.slice(b, b += type.sizeWrite(value)), value)
      this.context.set(name, value)
    }
  }

  sizeRead (buf) {
    let b = 0
    for (const [, type] of this.fields) {
      b += type.sizeRead(buf.slice(b))
    }
    return b
  }

  sizeWrite (val) {
    let b = 0
    for (const [name, type] of this.fields) {
      b += type.sizeWrite(val[name])
    }
    return b
  }
}
