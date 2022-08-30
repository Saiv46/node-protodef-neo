import test from 'ava'
import suite from 'chuhai'
import { Context } from '../src/datatypes/_shared.js'

function benchRead (inst, buffer) { return inst.read(buffer) }
function benchWrite (inst, buffer, value) { return inst.write(buffer, value) }
function benchSizeRead (inst, buffer) { return inst.sizeRead(buffer) }
function benchSizeWrite (inst, value) { return inst.sizeWrite(value) }

export default function ({ type: Type, value, bytes = 0, params = {}, name }) {
  if (!name) {
    name = Type.name
  }
  const instance = typeof Type !== 'function' ? Type : new Type(params, new Context())
  const buffer = Buffer.alloc(bytes)

  if (process.env.NODE_ENV === 'benchmark') {
    test(name, t => suite(name, s => {
      t.pass('Benchmarking...')
      s.bench(`${name} : sizeWrite()`, benchSizeWrite.bind(this, instance, value))
      s.bench(`${name} : write()`, benchWrite.bind(this, instance, buffer, value))
      s.bench(`${name} : sizeRead()`, benchSizeRead.bind(this, instance, buffer))
      s.bench(`${name} : read()`, benchRead.bind(this, instance, buffer))
    }))
    return
  }

  test(name, t => {
    t.deepEqual(instance.sizeWrite(value), bytes)
    t.notThrows(() => instance.write(buffer, value))
    t.deepEqual(instance.sizeRead(buffer), bytes)

    const res = instance.read(buffer)
    t.teardown(() => {
      if (t.passed) return
      t.log('Got buffer -', buffer.inspect(), `(${buffer.length} bytes)`)
    })
    if (typeof value === 'number' && !Number.isInteger(value)) {
      t.assert(Math.abs(res - value) < Number.EPSILON, `${res} (actual) and ${value} (expected) are not equal`)
    } else {
      t.deepEqual(res, value)
    }
  })
}
