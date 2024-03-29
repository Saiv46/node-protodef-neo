import { Complex, Countable, PartialReadError } from './_shared.js'
import { void as Void } from './primitives.js'
import bitBuffer from 'bit-buffer'
const { BitView } = bitBuffer

export class buffer extends Countable {
  constructor ({ rest, ...count }, context) {
    super(rest ? { countType: Void } : count, context)
    this.rest = !!rest
  }

  read (buf) { return buf.slice(this.sizeReadCount(buf), this.sizeRead(buf)) }
  write (buf, val) {
    if (this.rest) {
      val.copy(buf)
      return
    }
    const size = this.fixedSize || val.length
    this.writeCount(buf, size)
    val.copy(buf, this.sizeWriteCount(size), 0, size)
  }

  sizeRead (buf) {
    if (this.rest) return buf.length
    const size = this.sizeReadCount(buf) + this.readCount(buf)
    if (buf.length < size) { throw new PartialReadError() }
    return size
  }

  sizeWrite (val) { return this.sizeWriteCount(val.length) + val.length }
}

export class mapper extends Complex {
  constructor ({ type, mappings }, context) {
    super(context)
    this.type = this.constructDatatype(type)
    this.keys = new Map()
    this.values = new Map()
    this.sizes = new Map()
    for (let [k, v] of Object.entries(mappings)) {
      if (!isNaN(parseInt(k))) { k = parseInt(k) }
      this.keys.set(k, v)
      this.values.set(v, k)
      this.sizes.set(v, () => this.type.sizeWrite(k))
    }
  }

  read (buf) { return this.keys.get(this.type.read(buf)) }
  write (buf, val) { this.type.write(buf, this.values.get(val)) }
  sizeRead (buf) { return this.type.sizeRead(buf) }
  sizeWrite (val) { return this.sizes.get(val)() }
}

export class pstring extends Countable {
  read (buf) {
    return buf.toString('utf8', this.sizeReadCount(buf), this.sizeRead(buf))
  }

  write (buf, val) {
    const len = Buffer.byteLength(val)
    this.writeCount(buf, len)
    buf.write(val, this.sizeWriteCount(len))
  }

  sizeRead (buf) {
    const size = this.sizeReadCount(buf) + this.readCount(buf)
    if (buf.length < size) { throw new PartialReadError() }
    return size
  }
  sizeWrite (val) {
    const len = Buffer.byteLength(val)
    return this.sizeWriteCount(len) + len
  }
}

export class bitfield {
  constructor (fields) {
    this.fields = fields
    this.bitview = new BitView(Buffer.allocUnsafe(0))
    this.bitview.bigEndian = true
    this.bits = Math.ceil(fields.reduce((a, { size }) => a + size, 0) / 8)
  }

  read (buf) {
    this.bitview._view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    const res = {}
    let b = 0
    for (const { name, size, signed } of this.fields) {
      res[name] = this.bitview.getBits(b, size, signed)
      b += size
    }
    return res
  }

  write (buf, val) {
    this.bitview._view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    let b = 0
    for (const { name, size } of this.fields) {
      this.bitview.setBits(b, val[name], size)
      b += size
    }
  }

  sizeRead (buf) {
    if (buf.length < this.bits) { throw new PartialReadError() }
    return this.bits
  }
  sizeWrite (val) { return this.bits }
}

export class lbitfield extends bitfield {
  constructor (...args) {
    super(...args)
    this.bitview.bigEndian = true
  }
}
