import test from 'ava'
import { constructedMacro } from '../macros.js'
import {
  u8, varint, option, void as Void, switch as Switch
} from '../../src/datatypes/index.js'

test('switch ( i8, [varint] )', constructedMacro, Switch, 300, 2, {
  compareToValue: 1,
  fields: {
    0: u8,
    1: varint
  }
})
test('option ( void )', constructedMacro, option, undefined, 1, Void)
test('option ( u8 )', constructedMacro, option, 255, 2, u8)
