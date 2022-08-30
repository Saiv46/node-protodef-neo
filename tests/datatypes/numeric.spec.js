import testType from '../_test.js'
import * as num from '../../src/datatypes/numeric.js'
const test = (k, value, bytes) => {
  testType({ name: k, type: num[k], value, bytes })
  if (!k.startsWith('l')) test(`l${k}`, value, bytes)
}
const setup = (name, type, value, bytes, params) => testType({
  name, type, value, bytes, params
})

test('i8', 2 ** 7 - 1, 1)
test('u8', 2 ** 8 - 1, 1)
test('i16', 2 ** 15 - 1, 2)
test('u16', 2 ** 16 - 1, 2)
test('i32', 2 ** 31 - 1, 4)
test('u32', 2 ** 32 - 1, 4)
test('i64', [2 ** 31 - 1, 2 ** 31 - 1], 8)
test('u64', [2 ** 32 - 1, 2 ** 32 - 1], 8)
test('f32', 1.2 * (10 ** -31), 4)
test('f64', 2.3 * (10 ** -63), 8)
setup('varint ( short )', num.varint, 300, 2)
setup('lvarint ( short )', num.lvarint, 300, 2)
setup('varint ( long )', num.varint, 2 ** 50 - 1, 8)
setup('lvarint ( long )', num.lvarint, 2 ** 50 - 1, 8)
setup('int ( 3 bytes )', num.int, 2 ** 24 - 1, 3, { size: 3 })
setup('lint ( 6 bytes )', num.lint, 2 ** 48 - 1, 6, { size: 6 })
