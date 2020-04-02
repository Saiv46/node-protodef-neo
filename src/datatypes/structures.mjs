import { Complex, Countable } from './_shared.mjs'

export class array extends Countable {
  constructor ({ type, ...count }, context) {
    super(count, context)
    this.type = this.constructDatatype(type)
  }

  read (buf) {
    const l = this.readCount(buf)
    const res = []
    for (let i = 0, b = this.sizeReadCount(buf); i < l; i++) {
      const view = buf.slice(b)
      b += this.type.sizeRead(view)
      res.push(this.type.read(view))
    }
    return res
  }

  write (buf, val) {
    const l = val.length
    this.writeCount(buf, l)
    for (let i = 0, b = this.sizeWriteCount(l); i < l; i++) {
      this.type.write(buf.slice(b), val[i])
      b += this.type.sizeWrite(val[i])
    }
  }

  sizeRead (buf) {
    const l = this.readCount(buf)
    let size = this.sizeReadCount(buf)
    for (let i = 0; i < l; i++) {
      size += this.type.sizeRead(buf.slice(size))
    }
    return size
  }

  sizeWrite (val) {
    const l = val.length
    let size = this.sizeWriteCount(l)
    for (let i = 0; i < l; i++) {
      size += this.type.sizeWrite(val[i])
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

  read (buf) {
    const value = this.type.read(buf)
    this.context.set(this.countFor, value)
    return value
  }

  write (buf, val) { // TODO: Reimplement
    this.context.set(this.countFor, val)
    this.type.write(buf, val)
  }

  sizeRead (buf) { return this.type.sizeRead(buf) }
  sizeWrite (val) { return this.type.sizeWrite(val) }
}

const ANONYMOUS_FIELD = Symbol.for('ANONYMOUS_FIELD')
export class container extends Complex {
  constructor (fields, context) {
    super(context.child())
    this.fields = new Map()
    for (const { name, type, anon = false } of fields) {
      this.fields.set(
        anon ? ANONYMOUS_FIELD : name,
        this.constructDatatype(type)
      )
    }
    // If none of provided fields uses context - we can skip that
    this.skipContext = !Array.from(this.fields.values())
      .some(v => v instanceof Complex)
  }

  read (buf) {
    const res = {}
    let b = 0
    for (const [name, type] of this.fields) {
      const view = buf.slice(b)
      b += type.sizeRead(view)
      const value = type.read(view)
      if (name === ANONYMOUS_FIELD) {
        if (typeof value !== 'object') continue
        for (const k in value) {
          res[k] = value[k]
          if (this.skipContext) continue
          this.context.set(k, value[k])
        }
        continue
      }
      res[name] = value
      if (this.skipContext) continue
      this.context.set(name, value)
    }
    return res
  }

  write (buf, val) {
    let b = 0
    for (const [name, type] of this.fields) {
      if (name === ANONYMOUS_FIELD) {
        type.write(buf.slice(b, b += type.sizeWrite(val)), val)
        if (this.skipContext) continue
        for (const k in val) {
          this.context.set(k, val[k])
        }
        continue
      }
      const value = val[name]
      type.write(buf.slice(b, b += type.sizeWrite(value)), value)
      if (this.skipContext) continue
      this.context.set(name, value)
    }
  }

  sizeRead (buf) {
    let b = 0
    for (const [name, type] of this.fields) {
      const view = buf.slice(b)
      b += type.sizeRead(view)
      if (this.skipContext) continue
      const value = type.read(view)
      if (name === ANONYMOUS_FIELD) {
        for (const k in value) {
          this.context.set(k, value[k])
        }
        continue
      }
      if (this.skipContext) continue
      this.context.set(name, value)
    }
    return b
  }

  sizeWrite (val) {
    let b = 0
    for (const [name, type] of this.fields) {
      if (name === ANONYMOUS_FIELD) {
        b += type.sizeWrite(val)
        if (this.skipContext) continue
        for (const k in val) {
          this.context.set(k, val[k])
        }
        continue
      }
      const value = val[name]
      b += type.sizeWrite(value)
      if (this.skipContext) continue
      this.context.set(name, value)
    }
    return b
  }
}
