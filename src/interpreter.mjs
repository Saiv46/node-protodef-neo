import * as datatypes from './datatypes'
import { Protocol } from './shared.mjs'

export default class ProtocolInterpreter extends Protocol {
  addType (name, type = 'native') {
    if (type === 'native') { type = datatypes[name] }
    if (typeof type === 'function') {
      this.types[name] = type
      return
    }
    let [base, data] = type
    function processData (data) {
      if (data.countType) {
        data.countType = Array.isArray(data.type)
          ? [this.types[data.type[0]], processData(data.type[1])]
          : this.types[data.type]
      }
      if (data.type) {
        data.type = Array.isArray(data.type)
          ? [this.types[data.type[0]], processData(data.type[1])]
          : this.types[data.type]
      }
      return data
    }
    if (data) { data = processData(data) }
    this.types[name] = (...args) => new this.types[base](data, ...args)
  }
}
