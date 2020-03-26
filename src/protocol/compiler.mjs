// import * as datatypes from './datatypes'
const FUNC_REGEX = /(?:function){0,1}\s*\w+\s*\((.*)\)\s*{\s*([\s\S]*)\s*}/

/// TO BE IMPLEMENTED
export default class ProtocolCompiler {
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

  addType (name, type = 'native') {
    throw new Error('Not implemented yet')
  }
}
