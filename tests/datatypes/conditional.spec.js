import testType from '../_test.js'
import {
  u8, varint, option, void as Void, switch as Switch
} from '../../src/datatypes/index.js'
const setup = (name, type, value, bytes, params) => testType({
  name, type, value, bytes, params
})

setup('switch ( i8, [varint] )', Switch, 300, 2, {
  compareToValue: 1,
  fields: {
    0: u8,
    1: varint
  }
})
setup('option ( void )', option, undefined, 1, Void)
setup('option ( u8 )', option, 255, 2, u8)
