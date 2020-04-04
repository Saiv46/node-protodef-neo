import { Complex, Countable, PartialReadError } from './_shared.mjs'
import { void as Void } from './primitives.mjs'
import bitBuffer from 'bit-buffer'
const { BitView } = bitBuffer

export class buffer extends Countable {
  constructor ({ rest, ...count }) {
    super(rest ? { countType: Void } : count)
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

  sizeWrite (val) {
    const size = val.length
    return this.sizeWriteCount(size) + size
  }
}

export class mapper extends Complex {
  constructor ({ type, mappings }) {
    super()
    this.type = this.constructDatatype(type)
    this.keys = new Map()
    this.values = new Map()
    for (let [k, v] of Object.entries(mappings)) {
      if (!isNaN(parseInt(k))) { k = parseInt(k) }
      this.keys.set(k, v)
      this.values.set(v, k)
    }
  }

  read (buf, ctx) { return this.keys.get(this.type.read(buf, ctx)) }
  write (buf, val, ctx) { this.type.write(buf, this.values.get(val), ctx) }
  sizeRead (buf, ctx) { return this.type.sizeRead(buf, ctx) }
  sizeWrite (val) { return this.type.sizeWrite(this.values.get(val), ctx) }
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

  sizeRead (buf) { return this.sizeReadCount(buf) + this.readCount(buf) }
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

  read (buf, ctx) {
    this.bitview._view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    const res = {}
    let b = 0
    for (const { name, size, signed } of this.fields) {
      const value = this.bitview.getBits(b, size, signed)
      res[name] = value
      ctx.set(name, value)
      b += size
    }
    return res
  }

  write (buf, val, ctx) {
    this.bitview._view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
    let b = 0
    for (const { name, size } of this.fields) {
      this.bitview.setBits(b, val[name], size)
      ctx.set(name, val[name])
      b += size
    }
  }

  sizeRead (buf, ctx) { return this.bits }
  sizeWrite (val, ctx) { return this.bits }
}

export class lbitfield extends bitfield {
  constructor (...args) {
    super(...args)
    this.bitview.bigEndian = true
  }
}
