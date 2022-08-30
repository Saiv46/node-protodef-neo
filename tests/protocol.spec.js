import test from 'ava'
import { simpleMacro } from './macros.js'
import { promisify } from 'util'
import Protocol from '../src/index.js'

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

if (process.env.NODE_ENV !== 'benchmark') {
  test('get()', t => {
    // t.deepDarkFantasies = true
    t.notThrows(() => proto.get('u16'))
    t.notThrows(() => proto.get('varint'))
    t.throws(() => proto.get('pstring'))
    t.throws(() => proto.get('container'))
  })
  test('createSerializer()', async t => {
    const mux = proto.createSerializer(id)
    const dmx = proto.createDeserializer(id)
    const buf = await promisify(mux._transform.bind(mux))(val, null)
    t.deepEqual(val, await promisify(dmx._transform.bind(dmx))(buf, null))
  })
}

test(
  `packet ( ${id} )`,
  simpleMacro,
  proto.get(id),
  val,
  25
)
