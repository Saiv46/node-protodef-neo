import ProtocolInterface from './interface.mjs'
import { Context } from '../datatypes/_shared.mjs'
// import { void as _void } from '../datatypes/index.mjs'

export default class ProtocolInterpreter extends ProtocolInterface {
  constructor (...args) {
    super(...args)
    this.cache = new Map()
  }

  _resolveTypeNesting (data, parent) {
    const [type, args] = Array.isArray(data) ? data : [data]
    if (this.cache.has(type)) return this.cache.get(type)
    let Constructor = this.types[type]
    if (!Constructor) {
      throw new Error(`Datatype "${type}" not defined`)
    }
    if (Array.isArray(Constructor)) {
      Constructor = this._resolveTypeNesting(Constructor, type)
    }
    // TODO
    const rtn = v => this._resolveTypeNesting(v)
    function argsRecursive (t, v) {
      if (typeof v === 'string') return rtn(v)
      if (Array.isArray(v)) return v.map(argsRecursive)
      if (v.fields) {
        for (const k in v.fields) { v.fields[k] = rtn(v.fields[k]) }
      }
      ['type', 'countType', 'default'].forEach(k => { v[k] = rtn(v[k]) })
      return v
    }
    const result = args ? [Type, argsRecursive(args)] : Type
    return result
  }

  get (name) {
    if (typeof name === 'string') {
      if (!this.cache.has(name)) {
        this.cache.set(name, this.get(name.split('.')))
      }
      return this.cache.get(name)
    }
    const [current, ...nested] = name
    if (nested.length) {
      return this.namespace[current].get(nested)
    }
    const type = this.types[current]
    if (!type) {
      throw new Error(`Missing data type ${current}`)
    }
    return this._resolveTypeNesting(type)
  }
}
