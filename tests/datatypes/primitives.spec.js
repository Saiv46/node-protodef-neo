import test from 'ava'
import { simpleMacro } from '../macros.js'
import { bool, void as Void, cstring } from '../../src/datatypes/primitives.js'

test(simpleMacro, bool, true, 1)
test(simpleMacro, Void, undefined, 0)
test(simpleMacro, cstring, 'Hello world!', 13)
