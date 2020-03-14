export class Context {
  constructor (parent) {
    this.fields = []
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
  constructor (context = new Context()) {
    this.context = context
  }

  constructDatatype (Type) {
    return Array.isArray(Type)
      ? new Type[0](Type[1], this.context)
      : new Type()
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
    }
  }

  readCount (buf) {
    if (this.fixedSize) return this.fixedSize
    if (this.countType) return this.countType.read(buf)
    return this.context.get(this.countField)
  }

  writeCount (buf, val) {
    if (this.fixedSize) return
    if (this.countType) {
      this.countType.write(buf, val)
      return
    }
    this.context.set(this.countField, val)
  }

  sizeReadCount (buf) { return this.countType ? this.countType.sizeRead(buf) : 0 }
  sizeWriteCount (val) { return this.countType ? this.countType.sizeWrite(val) : 0 }
}
