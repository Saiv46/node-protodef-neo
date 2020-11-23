// PROTODEF_LAZYNESS environment variable
// - Increase to speedup recursive datatypes
// - Decrease to save memory
// - If value <= 1 - everything will be "lazy"
// - 0 = Slow mode
// - -1 = Never destruct (see below)
// After some time datatypes got destructed
// back to "lazy" state if they not "hot" enough
const { PROTODEF_LAZYNESS = 100 } = process.env

export const ANONYMOUS_FIELD = Symbol.for('ANONYMOUS_FIELD')

export class Context {
  constructor (parent) {
    this.fields = new Map()
    this.childrens = new Set()
    this.parent = parent
  }

  child () {
    const inst = new Context(this)
    this.childrens.add(inst)
    return inst
  }

  get (name) {
    const fields = name.split(/[./]/)
    let root = this

    const first = fields.shift()
    if (first) {
      while (root.parent) {
        if (root.has(first)) {
          root = root.fields.get(first)
          break
        }
        root = root.parent
      }
    }

    while (fields.length) {
      const field = fields.shift()
      if (root instanceof Context) {
        if (root.has(field)) {
          root = root.fields.get(field)
        } else {
          for (const child of root.childrens) {
            if (child.has(field)) {
              root = child.fields.get(field)
              break
            }
          }
        }
      } else { root = root[field] }
    }
    return root
  }

  has (field) { return this.fields.has(field) }
  set (name, value) {
    if (name === ANONYMOUS_FIELD) {
      for (const k in value) {
        this.fields.set(k, value[k])
      }
    } else {
      this.fields.set(name, value)
    }
    return this
  }
}

let NESTING = PROTODEF_LAZYNESS < 1 ? 1 : 0
export class Complex {
  constructor (context) {
    if (!context) {
      throw new Error('No context passed')
    }
    this.context = context
  }

  constructDatatype (Data) {
    if (!Array.isArray(Data)) return new Data()
    if (NESTING > PROTODEF_LAZYNESS) {
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

export class LazyDatatype extends Complex {
  constructor (args, context) {
    super(context)
    this.arguments = args
    this.datatype = null
    this.timer = 0
    this.hotness = 0
  }

  get () {
    this.hotness++
    if (this.datatype !== null) return this.datatype
    this.hotness += PROTODEF_LAZYNESS
    const [Type, params] = Array.isArray(this.arguments)
      ? this.arguments
      : [this.arguments]
    if (params !== undefined) {
      this.datatype = new Type(params, this.context)
    } else {
      this.datatype = new Type()
    }
    if (PROTODEF_LAZYNESS < 0) {
      this.arguments = null
      this.context = null
    } else {
      this.timer = setInterval(this.cleanup.bind(this), 0)
    }
    return this.datatype
  }

  cleanup () {
    if (this.hotness < PROTODEF_LAZYNESS) {
      this.datatype = null
      clearInterval(this.timer)
      this.timer = 0
    }
    this.hotness--
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
