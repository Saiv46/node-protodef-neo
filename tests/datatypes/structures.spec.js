import testType from '../_test.mjs'
import {
  array, count, container, u8, u32, varint, pstring
} from '../../src/datatypes/index.mjs'
const setup = (name, type, value, bytes, params) => testType({
  name, type, value, bytes, params
})
const arr = Array(5).fill(0).map((_, i) => 2 ** (8 * i) - 1)
const obj = { id: 2 ** 31, gender: 255, subgender: 301 }

setup('array ( 4 x u8 )', array, [255, 255, 255, 255], 4, { type: u8, count: 4 })
setup('array ( 5 x u32 + varint )', array, arr, 21, { type: u32, countType: varint })
setup('count ( 200 )', count, 42, 1, { type: u8, countFor: 'someField' })
setup('count ( varint )', count, 300, 2, { type: varint, countFor: 'someField' })
setup('container ( u32, u8, varint )', container, obj, 7, [
  { name: 'id', type: u32 },
  { name: 'gender', type: u8 },
  { name: 'subgender', type: varint }
])
setup('container ( u8, pstring )', container, { name: 'Saiv46', length: 6 }, 7, [
  { name: 'length', type: u8 },
  {
    name: 'name',
    type: [
      pstring,
      { count: 'length' }
    ]
  }
])
