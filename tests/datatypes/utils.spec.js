import testType from '../_test.js'
import { u8 } from '../../src/datatypes/numeric.js'
import * as utils from '../../src/datatypes/utils.js'
const setup = (k, value, bytes, params) => testType({
  type: utils[k], value, bytes, params
})
const bitfieldOpts = [
  { x: 2 ** 13 - 1, y: 2 ** 4 - 1, z: 2 ** 13 - 1 },
  4,
  [
    { name: 'x', size: 14, signed: true },
    { name: 'y', size: 4, signed: false },
    { name: 'z', size: 14, signed: true }
  ]
]

setup('buffer', Buffer.from([0x12, 0x34, 0x56, 0x78]), 4, { rest: true })
setup('pstring', 'Hello world!', 13, { countType: u8 })
setup('mapper', 'on', 1, { type: u8, mappings: { 255: 'on', 128: 'off' } })
setup('bitfield', ...bitfieldOpts)
setup('lbitfield', ...bitfieldOpts)
