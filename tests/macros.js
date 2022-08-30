import test from 'ava'
import suite from 'chuhai'
import { Context } from '../src/datatypes/_shared.js'

function benchmark (t, instance, value, buffer) {
  return suite(t.title, s => {
    t.log('Benchmarking...')
    s.bench(`${t.title} : sizeWrite()`, () => instance.sizeWrite(value))
    s.bench(`${t.title} : write()`, () => instance.write(buffer, value))
    s.bench(`${t.title} : sizeRead()`, () => instance.sizeRead(buffer))
    s.bench(`${t.title} : read()`, () => instance.read(buffer))
  })
}

export const simpleMacro = test.macro({
  exec(t, Type, value, length) {
    const instance = typeof Type === 'function' ? new Type : Type
    length ??= instance.size
    const buffer = Buffer.alloc(length)
    t.deepEqual(instance.sizeWrite(value), length)
    t.notThrows(() => instance.write(buffer, value))
    t.deepEqual(instance.sizeRead(buffer), length)
    const res = instance.read(buffer)
    if (process.env.NODE_ENV === 'benchmark') {
      t.teardown(() => benchmark(t, instance, value, buffer))
    }
    t.teardown(() => {
      if (t.passed) return
      t.log(buffer.inspect())
    })
    if (typeof value === 'number' && !Number.isInteger(value)) {
      t.assert(Math.abs(res - value) < Number.EPSILON, `${res} (actual) and ${value} (expected) are not equal`)
    } else {
      t.deepEqual(res, value)
    }
    if (length) {
      t.throws(() => instance.sizeRead(buffer.subarray(0, length - 1)))
    }
  },
  title(providedTitle, Type) {
    return providedTitle ?? Type.name
  }
})

export const constructedMacro = test.macro({
  exec(t, Type, value, length, params = {}) {
    const instance = new Type(params, new Context())
    if (!length) length = instance.size
    const buffer = Buffer.alloc(length)
    t.deepEqual(instance.sizeWrite(value), length)
    t.notThrows(() => instance.write(buffer, value))
    t.deepEqual(instance.sizeRead(buffer), length)
    const res = instance.read(buffer)
    if (process.env.NODE_ENV === 'benchmark') {
      t.teardown(() => benchmark(t, instance, value, buffer))
    }
    t.teardown(() => {
      if (t.passed) return
      t.log(buffer.inspect())
    })
    if (typeof value === 'number' && !Number.isInteger(value)) {
      t.assert(Math.abs(res - value) < Number.EPSILON, `${res} (actual) and ${value} (expected) are not equal`)
    } else {
      t.deepEqual(res, value)
    }
    if (!params?.rest) {
      t.throws(() => instance.sizeRead(buffer.subarray(0, length - 1)))
    }
  },
  title(providedTitle, Type) {
    return providedTitle ?? Type.name
  }
})
