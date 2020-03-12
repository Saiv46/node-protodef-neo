import test from 'ava'
import suite from 'chuhai'
import { Context } from '../src/datatypes/_shared.mjs'

export default function ({ type: Type, value, bytes = 0, params = {}, name }) {
  if (!name) {
    name = Type.name
  }
  const instance = new Type(params, new Context())
  const buffer = Buffer.alloc(bytes)
  test(name, t => {
    if (process.env.NODE_ENV === 'benchmark') {
      return suite(name, s => {
        s.set('delay', 0)
        s.set('maxTime', 0.01)
        s.set('minSamples', 20)
        s.bench(`${name} : constructor()`, () => new Type(params, new Context()))
        s.bench(`${name} : write()`, () => instance.write(buffer, value))
        s.bench(`${name} : read()`, () => instance.read(buffer))
        s.bench(`${name} : sizeRead()`, () => instance.sizeRead(buffer))
        s.bench(`${name} : sizeWrite()`, () => instance.sizeWrite(value))
        t.pass()
      })
    }
    t.log('Expected value:', value, `(${bytes} bytes)`)
    t.notThrows(() => instance.write(buffer, value))
    t.deepEqual(instance.sizeRead(buffer), bytes)
    t.deepEqual(instance.sizeWrite(value), bytes)
    const res = instance.read(buffer)
    t.log('Got buffer -', buffer.inspect(), '| value -', res)
    if (typeof res === 'number') {
      t.assert(Math.abs(res - value) < Number.EPSILON)
    } else {
      t.deepEqual(res, value)
    }
  })
}
