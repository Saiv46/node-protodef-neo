const FUNC_REGEX = /(?:function){0,1}\s*\w+\s*\((.*)\)\s*{\s*([\s\S]*)\s*}/

export class Context {
  constructor (parent) {
    this.fields = {}
    this.parent = parent
  }

  child () { return new Context(this) }
  get (field) {
    return this.has(field)
      ? this.fields[field]
      : (this.parent && this.parent.get(field))
  }

  has (field) { return this.fields[field] !== undefined }
  set (field, value) { this.fields[field] = value }
}

export class Complex {
  constructor (context) {
    if (!context) {
      throw new Error('No context passed')
    }
    this.context = context
  }

  constructDatatype (Type) {
    if (Array.isArray(Type)) return new Type[0](Type[1], this.context)
    return typeof Type === 'function' ? new Type() : Type
  }

  templateFunction (inst, method) {
    const temp = inst[`${method}Template`]
    if (temp) return temp('_' + (Math.random() * 1e8 | 0).toString(16))
    let [, args, body] = inst[method].toString().trim().match(FUNC_REGEX)
    args = args.split(/ *, */)
    if (body.startsWith('return ')) {
      if (method !== 'sizeWrite') {
        body = body.replace(new RegExp(args[0], 'g'), 'buf.slice(i)')
      }
    }
    return body
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
  constructor (buffer) {
    super()
    this.name = this.constructor.name
    this.buffer = buffer
    this.partialReadError = true
    Error.captureStackTrace(this, this.constructor.name)
  }
}
