import { Complex, Countable, ANONYMOUS_FIELD } from './_shared.mjs'
const { PROTODEF_COMPILE_STRUCTS = 0 } = process.env

export class array extends Countable {
  constructor ({ type, ...count }, context) {
    super(count, context)
    this.type = this.constructDatatype(type)
    if (!(this.type instanceof Complex) && !this.countFor) {
      this.context = null
    }
  }

  read (buf) {
    const res = []
    const l = this.readCount(buf)
    let b = this.sizeReadCount(buf)
    if (this.context) {
      for (let i = 0; i < l; i++) {
        const view = buf.slice(b)
        b += this.type.sizeRead(view)
        const value = this.type.read(view)
        res.push(value)
        this.context.set(i, value)
      }
    } else {
      for (let i = 0; i < l; i++) {
        const view = buf.slice(b)
        b += this.type.sizeRead(view)
        res.push(this.type.read(view))
      }
    }
    return res
  }

  write (buf, val) {
    let b = this.sizeWriteCount(val.length)
    this.writeCount(buf, val.length)
    if (this.context) {
      for (let i = 0; i < val.length; i++) {
        const value = val[i]
        this.type.write(buf.slice(b, b += this.type.sizeWrite(value)), value)
        this.context.set(i, value)
      }
    } else {
      for (const value of val) {
        this.type.write(buf.slice(b, b += this.type.sizeWrite(value)), value)
      }
    }
  }

  sizeRead (buf) {
    const l = this.readCount(buf)
    let size = this.sizeReadCount(buf)
    for (let i = 0; i < l; i++) {
      const view = buf.slice(size)
      size += this.type.sizeRead(view)
      if (this.context) this.context.set(i, this.type.read(view))
    }
    return size
  }

  sizeWrite (val) {
    const l = val.length
    let size = this.sizeWriteCount(l)
    if (this.context) {
      for (let i = 0; i < l; i++) {
        const value = val[i]
        size += this.type.sizeWrite(value)
        this.context.set(i, value)
      }
    } else {
      for (const value of val) {
        size += this.type.sizeWrite(value)
      }
    }
    return size
  }
}

export class count extends Complex {
  constructor ({ countFor, type }, context) {
    super(context)
    this.countFor = countFor
    this.type = this.constructDatatype(type)
    if (!(this.type instanceof Complex) && !this.countFor) {
      this.context = null
    }
  }

  read (buf) {
    const value = this.type.read(buf)
    if (this.context) this.context.set(this.countFor, value)
    return value
  }

  write (buf, val) { // TODO: Reimplement
    if (this.context) this.context.set(this.countFor, val)
    this.type.write(buf, val)
  }

  sizeRead (buf) { return this.type.sizeRead(buf) }
  sizeWrite (val) { return this.type.sizeWrite(val) }
}

export class container extends Complex {
  get ANONYMOUS_FIELD () { return ANONYMOUS_FIELD }

  constructor (fields, context) {
    super(context.child())
    this.fields = new Map()
    for (const { name, type, anon = false } of fields) {
      this.fields.set(
        anon ? this.ANONYMOUS_FIELD : name,
        this.constructDatatype(type)
      )
    }

    // If none of provided fields uses context - we can skip that
    if (!Array.from(this.fields.values()).some(v => v instanceof Complex)) {
      this.context = null
    }

    if (PROTODEF_COMPILE_STRUCTS) {
      let readCode = 'const res = {}\nlet b = 0\n'
      for (const [name] of this.fields) {
        if (name === ANONYMOUS_FIELD) {
          readCode += `{
            const type = this.fields.get(this.ANONYMOUS_FIELD)
            const view = buf.slice(b)
            b += type.sizeRead(view)
            const value = type.read(view)
            if (typeof value === 'object') {
              for (const k in value) {
                res[k] = value[k]
                ${this.context ? 'this.context.set(k, value[k])' : ''}
              }
            }
          }\n`
        } else {
          readCode += `{
            const type = this.fields.get("${name}")
            const view = buf.slice(b)
            b += type.sizeRead(view)
            const value = type.read(view)
            res["${name}"] = value
            ${this.context ? 'this.context.set("' + name + '", value)' : ''}
          }\n`
        }
      }
      readCode += 'return res'
      // eslint-disable-next-line no-new-func
      this.read = new Function('buf', readCode)
    }
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
        }
      } else {
        res[name] = value
      }
      if (this.context) this.context.set(name, value)
    }
    return res
  }

  write (buf, val) {
    let b = 0
    for (const [name, type] of this.fields) {
      const value = name !== ANONYMOUS_FIELD ? val[name] : val
      type.write(buf.slice(b, b += type.sizeWrite(value)), value)
      if (this.context) this.context.set(name, value)
    }
  }

  sizeRead (buf) {
    let b = 0
    for (const [name, type] of this.fields) {
      const view = buf.slice(b)
      b += type.sizeRead(view)
      if (this.context) this.context.set(name, type.read(view))
    }
    return b
  }

  sizeWrite (val) {
    let b = 0
    for (const [name, type] of this.fields) {
      const value = name !== ANONYMOUS_FIELD ? val[name] : val
      b += type.sizeWrite(value)
      if (this.context) this.context.set(name, value)
    }
    return b
  }
}
