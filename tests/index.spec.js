import test from 'ava'
import suite from 'chuhai'
import Protocol from '../src/index.mjs'
import { benchType } from './_test.mjs'

const proto = new Protocol({
  types: {
    u16: 'native',
    varint: 'native',
    pstring: 'native',
    container: 'native'
  },
  namespace: {
    types: {
      string: [
        'pstring',
        { countType: 'varint' }
      ]
    },
    set_protocol: [
      'container',
      [
        { name: 'protocolVersion', type: 'varint' },
        { name: 'serverHost', type: 'string' },
        { name: 'serverPort', type: 'u16' },
        { name: 'nextState', type: 'varint' }
      ]
    ]
  }
})
const id = 'namespace.set_protocol'
const val = {
  protocolVersion: 365,
  serverHost: 'test.openmc.example',
  serverPort: 25565,
  nextState: 1
}

test('Protocol', async t => {
  // t.deepDarkFantasies = true
  t.notThrows(() => proto.get('u16'))
  t.notThrows(() => proto.get('varint'))
  t.throws(() => proto.get('pstring'))
  t.throws(() => proto.get('container'))
  const buf = Buffer.alloc(25)
  t.deepEqual(proto.sizeWrite(id, val), buf.length)
  t.notThrows(() => proto.write(id, buf, val))
  t.deepEqual(proto.sizeRead(id, buf), buf.length)
  t.deepEqual(proto.read(id, buf), val)
  if (process.env.NODE_ENV === 'benchmark') {
    await suite('Protocol', benchType('complex', proto.get(id), buf, val))
  }
})

test('(De-)Serializer', async t => {
  const mux = proto.createSerializer(id)
  const dmx = proto.createDeserializer(id)
  Array(100).fill(val).forEach(v => mux.write(v))
  for await (const res of mux.end().pipe(dmx)) {
    t.deepEqual(val, res)
  }
})
