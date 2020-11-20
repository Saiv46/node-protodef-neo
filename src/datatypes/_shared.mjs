const NESTING_LAZYNESS = process.env.PROTODEF_LAZYMODE ? 8 : 64

export class Context {
  constructor (parent) {
    this.fields = new Map()
    this.childrens = new Set()
    this.parent = parent
  }

  child () {
    const inst = new Context(this)
    inst.childrens.add(inst)
    return inst
  }

  get (field) {
    field = field.split('/')
    let root = this
    /** if (!field[0].startsWith('.')) {
      while (root.parent) {
        if (root.has(field[0])) break
        root = root.parent
      }
    } */
    while (field.length) {
      const name = field.shift()
      if (name === '..') {
        root = root.parent
        continue
      }
      if (root instanceof Context) {
        if (root.has(name)) {
          root = root.fields.get(name)
        } else {
          for (const child of root.childrens) {
            if (child.has(name)) {
              root = child.fields.get(name)
              break
            }
          }
        }
        continue
      }
      root = root[name]
    }
    return root
  }

  has (field) { return this.fields.has(field) }
  set (field, value) {
    this.fields.set(field, value)
  }
}

let NESTING = 0
export class Complex {
  constructor (context) {
    if (!context) {
      throw new Error('No context passed')
    }
    this.context = context
  }

  constructDatatype (Data) {
    if (!Array.isArray(Data)) return new Data()
    if (NESTING > NESTING_LAZYNESS) {
      return new LazyDatatype(Data, this.context)
    }
    NESTING++
    const [Type, params] = Data
    const format = (obj, params) => {
      if (typeof obj === 'string' && obj.startsWith('$')) {
        obj = params[obj.substr(1)]
      }
      if (typeof obj !== 'object') return obj
      for (const k in obj) { obj[k] = format(obj[k], params) }
      return obj
    }
    const res = Array.isArray(Type)
      ? this.constructDatatype(format(Type, params))
      : new Type(params, this.context)

    NESTING--
    return res
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

export class LazyDatatype {
  constructor (args, context) {
    this.constructArguments = args
    this.constructContext = context
    this.datatype = null
  }

  get () {
    if (this.datatype !== null) return this.datatype
    const [Type, params] = Array.isArray(this.constructArguments)
      ? this.constructArguments
      : [this.constructArguments]
    if (params !== undefined) {
      for (const k in params) {
        const v = params[k]
        if (Array.isArray(v) || params[k] === 'function') {
          params[k] = new LazyDatatype(v, this.constructContext)
        }
        this.datatype = new Type(params, this.constructContext)
      }
    } else {
      this.datatype = new Type()
    }
    // We don't need this anymore
    this.constructDatatype = null
    this.constructContext = null
    return this.datatype
  }

  read (buf) { return this.get().read(buf) }
  write (buf, val) { return this.get().write(buf, val) }
  sizeRead (buf) { return this.get().sizeRead(buf) }
  sizeWrite (val) { return this.get().sizeWrite(val) }
  readCount (buf) { return this.get().readCount(buf) }
  writeCount (buf, val) { return this.get().writeCount(buf, val) }
  sizeReadCount (buf) { return this.get().sizeReadCount(buf) }
  sizeWriteCount (val) { return this.get().sizeWriteCount(val) }
}
