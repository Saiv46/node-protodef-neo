import { Transform } from 'stream' // TODO: Use readable-stream instead
import { constructDatatype } from './datatypes/_shared.mjs'

export class Protocol {
  constructor ({ types, ...namespaces }) {
    this.types = {}
    this.namespace = {}
    Object.entries(types).forEach(v => this.addType(...v))
    Object.entries(namespaces).forEach(v => this.addNamespace(...v))
  }

  addNamespace (name, { types, ...data }) {
    this.namespace[name] = new this.constructor({ types: { ...this.types, ...types }, ...data })
  }

  get (name) {
    if (typeof name === 'string') {
      name = name.split('.')
    }
    const [current, ...nested] = name
    if (nested.length) {
      try {
        return this.namespace[current].get(nested)
      } catch (e) {
        if (e instanceof Error) {
          e.message += `.${nested[0]}`
        }
        throw e
      }
    }
    const type = this.types[current]
    if (!type) {
      throw new Error(`Missing data type ${current}`)
    }
    return constructDatatype(type)
  }

  read (name, ...args) { return this.get(name).read(...args) }
  write (name, ...args) { return this.get(name).write(...args) }
  sizeRead (name, ...args) { return this.get(name).sizeRead(...args) }
  sizeWrite (name, ...args) { return this.get(name).sizeWrite(...args) }
  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new Deserializer(this.get(name)) }
}

class Serializer extends Transform {
  constructor (inst) {
    super({ writableObjectMode: true })
    this.instance = inst
  }

  _transform (val, _, cb) {
    try {
      const buf = Buffer.allocUnsafe(this.instance.sizeWrite(val))
      this.instance.write(buf, val)
      cb(null, buf)
    } catch (e) {
      cb(e)
    }
  }
}

class Deserializer extends Transform {
  constructor (inst) {
    super({ readableObjectMode: true })
    this.instance = inst
  }

  _transform (val, enc, cb) {
    if (enc !== 'buffer') {
      val = Buffer.from(val, enc)
    }
    try {
      cb(null, this.instance.read(val))
    } catch (e) {
      cb(e)
    }
  }
}
