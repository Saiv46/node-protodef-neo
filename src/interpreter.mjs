import { Protocol } from './shared.mjs'

function callProcessType (args) {
  if (args.type) { args.type = processType(args.type) }
  if (args.countType) { args.countType = processType(args.countType) }
  return args
}

export default class ProtocolInterpreter extends Protocol {
  constructor (...args) {
    super(...args)
    this.cache = new WeakSet()
  }

  _process (datatype) {
    return datatype
  }
}
