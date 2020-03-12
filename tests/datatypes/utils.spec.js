import test from 'ava'
import { testType } from '../../src/shared.mjs'
import { u8 } from '../../src/datatypes/numeric.mjs'
import * as utils from '../../src/datatypes/utils.mjs'
const setup = (k, v, b, o) => testType(utils[k], v, b, o, test)
const bitfield = [
  {
    
  },
  64,
  {
    
  }
]

setup('buffer', Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]), 4, { rest: true })
setup('pstring', 'Hello world!', 13, { countType: u8 })
setup('mapper', 'on', 1, { type: u8, mappings: { 255: 'on', 128: 'off' } })
setup('bitfield', ...bitfield)
setup('lbitfield', ...bitfield)