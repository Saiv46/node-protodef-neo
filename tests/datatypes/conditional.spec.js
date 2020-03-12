import testType from '../_test.mjs'
// import { pstring } from '../../src/datatypes/utils.mjs'
import { u8 } from '../../src/datatypes/numeric.mjs'
import { void as Void } from '../../src/datatypes/primitives.mjs'
import { switch as Switch, option } from '../../src/datatypes/conditional.mjs'
const setup = (name, type, value, bytes, params) => testType({
  name, type, value, bytes, params
})

// setup.todo('switch')
// setup('switch ( u8 - u8, varint )', Switch, 255, 2, { })
setup('option ( void )', option, undefined, 1, { type: Void })
setup('option ( u8 )', option, 255, 2, { type: u8 })
