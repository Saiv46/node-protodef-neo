import test from 'ava'
import { constructedMacro } from '../macros.js'
import { u8 } from '../../src/datatypes/numeric.js'
import * as utils from '../../src/datatypes/utils.js'

test(constructedMacro, utils.buffer, Buffer.from([0x12, 0x34, 0x56, 0x78]), 4, { rest: true })
test('buffer ( u8 )', constructedMacro, utils.buffer, Buffer.from([0x12, 0x34, 0x56]), 4, { countType: u8 })
test(constructedMacro, utils.pstring, 'Hello world!', 13, { countType: u8 })
test(constructedMacro, utils.mapper, 'on', 1, {
  type: u8,
  mappings: { 255: 'on', 128: 'off' }
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
test(constructedMacro, utils.bitfield, ...bitfieldOpts)
test(constructedMacro, utils.lbitfield, ...bitfieldOpts)
