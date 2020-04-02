// Import this module
const Protocol = require('protodef-neo')

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

// Write & Read with ease
const buf = proto.toBuffer('main.packet', {
  keys: ['hello', 'example', 'hw'],
  value: Buffer.from('Hello world!')
})
const { keys, value } = proto.fromBuffer('main.packet', buf)

console.log(keys)
console.log(value.toString())
