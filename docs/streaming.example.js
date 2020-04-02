// Import this module
const Protocol = require('..')
// const Protocol = require('protodef-neo')

// Describe your protocol
const proto = new Protocol({
  types: {
    u8: 'native',
    array: 'native',
    buffer: 'native',
    container: 'native',
    pstring: 'native',
    short_string: [
      'pstring',
      { countType: 'u8' }
    ],
    short_string_array: [
      'array',
      { type: 'short_string' }
    ]
  },
  main: {
    packet: [
      'container',
      [
        { name: 'keys', type: 'short_string_array' },
        { name: 'value', type: ['buffer', { countType: 'u8' }] }
      ]
    ]
  }
})

// Create (de-)serializer for packet
const mux = proto.createSerializer('main.packet')
const dmx = proto.createDeserializer('main.packet')

// (`.pipe()` it anywhere)
