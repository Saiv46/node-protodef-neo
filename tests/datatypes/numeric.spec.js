import test from 'ava'
import { simpleMacro, constructedMacro } from '../macros.js'
import * as num from '../../src/datatypes/numeric.js'

test(simpleMacro, num.i8, 2 ** 7 - 1)
test(simpleMacro, num.u8, 2 ** 8 - 1)

test(simpleMacro, num.bi16, -(2 ** 15))
test(simpleMacro, num.bu16, 2 ** 16 - 1)
test(simpleMacro, num.bi32, -(2 ** 31))
test(simpleMacro, num.bu32, 2 ** 32 - 1)
test(simpleMacro, num.bi64, [-(2 ** 31), -(2 ** 31 )])
test(simpleMacro, num.bu64, [2 ** 32 - 1, 2 ** 32 - 1])

test(simpleMacro, num.li16, -(2 ** 15))
test(simpleMacro, num.lu16, 2 ** 16 - 1)
test(simpleMacro, num.li32, -(2 ** 31))
test(simpleMacro, num.lu32, 2 ** 32 - 1)
test(simpleMacro, num.li64, [-(2 ** 31), -(2 ** 31)])
test(simpleMacro, num.lu64, [2 ** 32 - 1, 2 ** 32 - 1])

test(simpleMacro, num.f32, 1.2 * (10 ** -31))
test(simpleMacro, num.f64, 2.3 * (10 ** -63))

test('varint', simpleMacro, num.varint, 2 ** 50 - 1, 8)
test('lvarint', simpleMacro, num.lvarint, 2 ** 50 - 1, 8)
test('uint ( 3 bytes )', constructedMacro, num.int, 2 ** 24 - 1, 3, { size: 3, signed: false })
test('luint ( 6 bytes )', constructedMacro, num.lint, 2 ** 48 - 1, 6, { size: 6, signed: false })
test('int ( 3 bytes )', constructedMacro, num.int, -(2 ** 23 - 1), 3, { size: 3, signed: true })
test('lint ( 6 bytes )', constructedMacro, num.lint, -(2 ** 47 - 1), 6, { size: 6, signed: true })
