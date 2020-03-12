import { Complex, Countable } from './_shared.mjs'
import { void as Void } from './primitives.mjs'
import bitBuffer from 'bit-buffer'
const { BitView } = bitBuffer

export class buffer extends Countable {
  constructor ({ rest, ...count }, context) {
    super(rest ? { countType: Void } : count, context)
    this.rest = !!rest
  }

  static get type () { return Buffer.from }
  read (buf) { return buf.slice(this.sizeReadCount(buf), this.sizeRead(buf)) }
  write (buf, val) {
    if (this.rest) {
      val.copy(buf)
      return
    }
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

export class lbitfield {
  static get type () { return Object }
  constructor (fields) {
    this.fields = fields
    this.bits = Math.ceil(fields.reduce((a, { size }) => a + size, 0) / 8)
  }

  read (buf) {
    const bits = new BitView(buf)
    bits.bigEndian = this.bigEndian
    const res = {}
    let b = 0
    for (const { name, size, signed } of this.fields) {
      res[name] = bits.getBits(b, size, signed)
      b += size
    }
    return res
  }

  write (buf, val) {
    const bits = new BitView(buf)
    bits.bigEndian = this.bigEndian
    let b = 0
    for (const { name, size } of this.fields) {
      bits.setBits(b, val[name], size)
      b += size
    }
  }

  sizeRead (buf) { return this.bits }
  sizeWrite (val) { return this.bits }
}

export class bitfield extends lbitfield {
  constructor (...args) {
    super(...args)
    this.bigEndian = true
  }
  /* _generateBitmasks(offset, size) {
    const arr = Array(Math.ceil((offset + size) / 8)).fill(0)
    let i = offset / 8 | 0
    offset %= 8
    while (size) {
      const bytes = Math.min(size, 8 - offset, 8)
      arr[i++] = ((1 << bytes) - 1) << (8 - bytes) >> offset
      size -= bytes
      if (offset) offset = 0
    }
    return arr
  } */
}
