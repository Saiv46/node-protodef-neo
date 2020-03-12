import test from 'ava'
import { testType } from '../../src/shared.mjs'
import * as primitives from '../../src/datatypes/primitives.mjs'
const setup = (k, v, b) => testType(primitives[k], v, b, {}, test)

setup('bool', true, 1)
setup('void', undefined, 0)
setup('cstring', 'Hello world!', 13)