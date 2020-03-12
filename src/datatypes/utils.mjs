import { Complex, Countable } from './_shared.mjs'
import { void as Void } from './primitives.mjs'

export class buffer extends Countable {
  constructor ({ rest, ...count }, context) {
    super(rest ? { countType: Void } : count, context)
    this.rest = !!rest
  }
  static get type () { return Buffer.from }
  read (buf) { return buf.slice(this.sizeReadCount(buf), this.sizeRead(buf)) }
  write (buf, val) {
    if (this.rest) return void val.copy(buf)
    this.writeCount(buf, val.length)
    val.copy(buf, this.sizeWriteCount(val))
  }
  sizeRead (buf) {
    if (this.rest) return buf.length
    return this.sizeReadCount(buf) + this.readCount(buf)
  }
  sizeWrite (val) { return this.sizeWriteCount(val) + val.length }
}

export class mapper extends Complex {
  constructor ({ type, mappings }, context) {
    super(context)
    this.type = this.constructDatatype(type)
    this.keys = new Map()
    this.values = new Map()
    this.sizes = new Map()
    for (let [k, v] of Object.entries(mappings)) {
      v = `${v}`
      this.keys.set(k, v)
      this.values.set(v, k)
      this.sizes.set(v, this.type.sizeWrite(k))
    }
  }
  read (buf) { return this.keys.get(`${this.type.read(buf)}`) }
  write (buf, val) { this.type.write(buf, this.values.get(`${val}`)) }
  sizeRead (buf) { return this.type.sizeRead(buf) }
  sizeWrite (val) { return this.sizes.get(`${val}`) }
}

export class pstring extends Countable {
  static get type () { return String }
  read (buf) {
    return buf.toString('utf8', this.sizeReadCount(buf), this.sizeRead(buf))
  }
  write (buf, val) {
    this.writeCount(buf, Buffer.byteLength(val))
    buf.write(val, this.sizeWriteCount(val))
  }
  sizeRead (buf) { return this.sizeReadCount(buf) + this.readCount(buf) }
  sizeWrite (val) { return this.sizeWriteCount(val) + Buffer.byteLength(val) }
}

export class bitfield {
  static get type () { return Object }
  _endianReadFunction (value, byte, read, i, bitOffset) {
    value <<= read
    value |= (byte >> (8 - read - bitOffset)) & ~(0xFF << read)
    return value
  }
  _endianWriteFunction (value, read, wrote, i, bitOffset, size) {
    const mask = ~(~0 << wrote)
    const destShift = 8 - bitOffset - wrote
    return (read & ~(mask << destShift)) | (((value >> (size - i - wrote)) & mask) << destShift)
  }

  constructField({ name, size, signed }, i) {

    return {
      read,
      write,
      sizeRead (buf) { return size },
      sizeWrite (val) { return size }
    }
  }

  constructor (fields) {
    this.fields = []

    this.fields = fields.map(this.constructField, this)

    this.bits = fields.reduce((a, v) => a + v.size, 0)
    let i = 0
    let masks = new Array(this.bits / 8 | 0).fill(0)
    for (const { name, size, signed } of fields) {
      masks[i / 8 | 0] |= 
      i = i % 8

      this.fields.push({
        name,
        size,
        read (buf) {
          let value = 0
          for (let i = 0, offset = 0; i < size;) {
            const bitOffset = offset & 7
            const read = Math.min(size - i, 8 - bitOffset)
            value = this._endianReadFunction(
              value, buf[offset >> 3], read, i, bitOffset
            )
            offset += read
            i += read
          }
          if (signed) {
            if (size !== 32 && value & (1 << (size - 1))) {
              value |= -1 ^ ((1 << size) - 1)
            }
            return value
          }
          return value >>> 0
        },
        write (buf, val) {
          for (let i = 0, offset = 0; i < size;) {
            const bitOffset = offset & 7
            const wrote = Math.min(size - 1, 8 - bitOffset)
            const byteOffset = offset >> 3
            buf[byteOffset] = this._endianWriteFunction(
              val, buf[byteOffset], wrote, i, bitOffset, size
            )
            offset += wrote
            i += wrote
          }
        }
      })
    }
  }
  read (buf) {
    let i = 0; const res = {}
    for (const { name, size, read } of this.fields) {
      res[name] = read(buf.slice(i, i += size))
    }
    return res
  }
  write (buf, val) {
    let i = 0
    for (const { name, size, write } of this.fields) {
      write(buf.slice(i, i += size), val[name])
    }
  }
  sizeRead (buf) { return this.bits }
  sizeWrite (val) { return this.bits }
}

export class lbitfield extends bitfield {
  // Little-endian bitfield
  _endianReadFunction (value, byte, read, i, bitOffset) {
    return value |= ((byte >> bitOffset) & ~(0xFF << read)) << i
  }
  _endianWriteFunction (value, read, wrote, i, bitOffset) {
    const mask = ~(0xFF << wrote)
    return (read & (~(mask << bitOffset))) | (((value >> wrote) & mask) << bitOffset)
  }
}
