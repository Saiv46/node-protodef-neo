import test from 'ava'
import suite from 'chuhai'
import { Context } from '../src/datatypes/_shared.mjs'

export function benchType (name, inst, buffer, value, cb = () => {}) {
  return s => {
    s.bench(`${name} : sizeWrite()`, () => inst.sizeWrite(value))
    s.bench(`${name} : write()`, () => inst.write(buffer, value))
    s.bench(`${name} : sizeRead()`, () => inst.sizeRead(buffer))
    s.bench(`${name} : read()`, () => inst.read(buffer))
    cb()
  }
}

export default function ({ type: Type, value, bytes = 0, params = {}, name }) {
  if (!name) {
    name = Type.name
  }
  const instance = new Type(params, new Context())
  const buffer = Buffer.alloc(bytes)
  test(name, async t => {
    t.log('Expected value:', value, `(${bytes} bytes)`)
    t.deepEqual(instance.sizeWrite(value), bytes)
    t.notThrows(() => instance.write(buffer, value))
    t.deepEqual(instance.sizeRead(buffer), bytes)
    const res = instance.read(buffer)
    t.log('Got buffer -', buffer.inspect(), '| value -', res)
    if (typeof res === 'number') {
      t.assert(Math.abs(res - value) < Number.EPSILON, `${res} and ${value} are not equal`)
    } else {
      t.deepEqual(res, value)
    }
    if (process.env.NODE_ENV === 'benchmark') {
      await suite(name, benchType(name, instance, buffer, value, () => t.pass()))
    }
  })
}
