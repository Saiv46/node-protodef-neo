import { Protocol } from './shared.mjs'

export default class ProtocolInterpreter extends Protocol {
  _process (datatype) {
    const [Constructor, Params] = Array.isArray(datatype) ? datatype : [datatype]
    return new Constructor(Params, this.rootContext)
  }
}
