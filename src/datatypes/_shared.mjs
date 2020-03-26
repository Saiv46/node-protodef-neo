export class Context {
  constructor (parent) {
    this.fields = new Map()
    this.parent = parent
  }

  child () { return new Context(this) }
  get (field) {
    if (this.has(field)) return this.fields.get(field)
    return this.parent && this.parent.get(field)
  }

  has (field) { return this.fields.has(field) }
  set (field, value) { this.fields.set(field, value) }
}

export class Complex {
  constructor (context) {
    if (!context) {
      throw new Error('No context passed')
    }
    this.context = context
  }

  constructDatatype (Data) {
    if (!Array.isArray(Data)) return new Data()
    const [Type, params] = Data
    const format = (obj, params) => {
      if (typeof obj === 'string' && obj.startsWith('$')) {
        obj = params[obj.substr(1)]
      }
      if (typeof obj !== 'object') return obj
      for (const k in obj) { obj[k] = format(obj[k], params) }
      return obj
    }
    if (!Array.isArray(Type)) return new Type(params, this.context.child())
    return this.constructDatatype(format(Type, params))
  }
}

export class Countable extends Complex {
  constructor ({ countType, count }, context) {
    super(context)
    if (countType) {
      this.countType = this.constructDatatype(countType)
    } else if (typeof count === 'number') {
      this.fixedSize = count
    } else if (typeof count === 'string') {
      this.countField = count
    } else {
      throw new Error('No count field passed')
    }
  }

  readCount (buf) {
    if (this.countType) return this.countType.read(buf)
    return this.countField
      ? this.context.get(this.countField)
      : this.fixedSize
  }

  writeCount (buf, val) {
    if (this.countType) {
      this.countType.write(buf, val)
      return
    }
    if (this.countField) this.context.set(this.countField, val)
  }

  sizeReadCount (buf) { return this.countType ? this.countType.sizeRead(buf) : 0 }
  sizeWriteCount (val) { return this.countType ? this.countType.sizeWrite(val) : 0 }
}

export class PartialReadError extends Error {
  constructor () {
    super()
    this.name = this.constructor.name
    this.partialReadError = true
    Error.captureStackTrace(this, this.constructor.name)
  }
}
