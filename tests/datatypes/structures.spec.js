import test from 'ava'
import { testType } from '../../src/shared.mjs'
import { u8 } from '../../src/datatypes/numeric.mjs'
import { cstring } from '../../src/datatypes/primitives.mjs'
import * as structures from '../../src/datatypes/structures.mjs'
const setup = (k, v, b, o) => testType(structures[k], v, b, o, test)

setup('array', [255, 255, 255], 4, { type: u8, countType: u8 })
setup('count', 42, 1, { type: u8, countFor: 'someField' })
setup('container', { name: 'Saiv46', level: 80 }, 8, [
	{ name: 'name', type: cstring },
	{ name: 'level', type: u8 }
])
