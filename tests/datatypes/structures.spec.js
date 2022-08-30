import test from 'ava'
import { constructedMacro } from '../macros.js'
import {
  array, count, container, u8, u32, varint, pstring
} from '../../src/datatypes/index.js'

const arr = Array.from(Array(5), (_, i) => 2 ** (8 * i) - 1)
test('array ( 4 x u8 )', constructedMacro, array, arr.slice(0, 4).map(v => v & 0xff), 4, { type: u8, count: 4 })
test('array ( 5 x u32 + varint )', constructedMacro, array, arr, 21, { type: u32, countType: varint })

test('count ( 200 )', constructedMacro, count, 42, 1, { type: u8, countFor: 'someField' })
test('count ( varint )', constructedMacro, count, 300, 2, { type: varint, countFor: 'someField' })

test('container ( u32, u8, varint )', constructedMacro, container, {
  id: 2 ** 31,
  gender: 255,
  subgender: 301
}, 7, [
  { name: 'id', type: u32 },
  { name: 'gender', type: u8 },
  { name: 'subgender', type: varint }
])
test('container ( u8, pstring )', constructedMacro, container, {
  name: 'Saiv46',
  length: 6
}, 7, [
  { name: 'length', type: [
      count,
      {
        type: u8,
        countFor: 'name'
      }
    ]
  },
  {
    name: 'name',
    type: [
      pstring,
      { count: 'length' }
    ]
  }
])
