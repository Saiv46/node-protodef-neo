// Import this module
const Protocol = require('protodef-neo')
const { ComplexDatatype, PartialReadError } = Protocol

// Define your own datatype
class frame extends ComplexDatatype {
  constructor ({ type, magic = 0xF0 }, context) {
    super(context)
    this.magic = magic & 0xFF
    this.type = this.constructDatatype(type)
  }

  read (buf) { return this.type.read(buf.slice(1)) }
  write (buf, val) {
    buf[0] = this.magic
    this.type.write(buf, val)
    buf[this.type.sizeWrite(val)] = this.magic
  }

  sizeRead (buf) {
    const i = this.type.sizeRead(buf.slice(1)) + 1
    if (buf[0] !== this.magic || buf[i] !== this.magic) {
      throw new PartialReadError()
    }
    return i
  }

  sizeWrite (val) { return this.type.sizeWrite(val) + 2 }
}

// Describe your protocol
const proto = new Protocol({
  types: {
    u8: 'native',
    array: 'native',
    frame: frame, // You can define
    container: 'native',
    cstring: 'native',
    string: [
      'frame',
      {
        type: 'cstring',
        magic: 128
      }
    ],
    shorts: [
      'frame',
      {
        type: [
          'array',
          {
            countType: 'u8',
            type: 'u8'
          }
        ],
        magic: 0
      }
    ]
  },
  just: {
    packet: [
      'container',
      [
        { name: 'name', type: 'string' },
        { name: 'ids', type: 'shorts' }
      ]
    ]
  }
})

// Write & Read with ease
const buf = proto.toBuffer('just.packet', {
  name: 'A null-terminated string',
  ids: [1, 2, 3, 5, 8, 13, 21, 34, 60, 94, 154, 248]
})

console.log(proto.fromBuffer('just.packet', buf))
