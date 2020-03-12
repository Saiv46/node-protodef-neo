import testType from '../_test.mjs'
import { bool, void as Void, cstring } from '../../src/datatypes/primitives.mjs'
const setup = (type, value, bytes) => testType({ type, value, bytes })

setup(bool, true, 1)
setup(Void)
setup(cstring, 'Hello world!', 13)
