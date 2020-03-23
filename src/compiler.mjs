// import * as datatypes from './datatypes'
import { Protocol } from './shared.mjs'
// const FUNC_REGEX = /(?:function\s+)?\w+\s?\((.+)\)\s*{\s*([\s\S]+)\s*}/i

/// TO BE IMPLEMENTED
export default class ProtocolCompiler extends Protocol {
  addType (name, type = 'native') {
    throw new Error('Not implemented yet')
  }
}
