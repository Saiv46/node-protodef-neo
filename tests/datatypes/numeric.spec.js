import test from 'ava'
import { testType } from '../../src/shared.mjs'
import * as numeric from '../../src/datatypes/numeric.mjs'
const setup = (k, v, b, o = {}) => {
	testType(numeric[k], v, b, o, test)
	if (!k.startsWith('l')) setup(`l${k}`, v, b, o)
}

setup('i8', 2**7-1, 1)
setup('u8', 2**8-1, 1)
setup('i16', 2**15-1, 2)
setup('u16', 2**16-1, 2)
setup('i32', 2**31-1, 4)
setup('u32', 2**32-1, 4)
setup('i64', 2n**63n-1n, 8)
setup('u64', 2n**64n-1n, 8)
setup('f32', 1.2*(10**-31), 4)
setup('f64', 2.3*(10**-63), 8)
setup('varint', 300, 2)
setup('int', 0xffffff, 3, { size: 3 })
