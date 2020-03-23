import Interpreter from './interpreter.mjs'
// Trying to make it backward-compatible
export class ProtoDef extends Interpreter {
  addType (name, data) {
    if (Array.isArray(data) && data.length === 3) {
      data = LegacyDatatype.prepare(this, data)
    }
    return super.addType(name, data)
  }

  read (buf, offset, name) {
    return {
      size: this.sizeRead(name, buf.slice(offset)),
      value: super.read(name, buf.slice(offset))
    }
  }

  write (val, buf, offset, name) {
    return offset + super.write(name, buf.slice(offset), val)
  }

  sizeOf (val, name) {
    return this.sizeWrite(name, val)
  }

  createPacketBuffer (name, value) {
    const buffer = Buffer.allocUnsafe(this.sizeWrite(name, value))
    super.write(name, buffer, value)
    return buffer
  }

  parsePacketBuffer (name, buf) {
    const data = super.read(name, buf)
    const size = this.sizeRead(name, buf)
    return {
      data,
      metadata: { size },
      buffer: buf.slice(0, size)
    }
  }
}

class InternalLegacyDatatype {
  constructor (proto) {
    this.proto = proto
  }

  read (buf, off, type, opts) {
    const view = buf.slice(off)
    const inst = this.proto._resolveTypeNesting([type, opts])
    return {
      size: inst.sizeRead(view),
      value: inst.read(view)
    }
  }

  write (val, buf, off, type, opts) {
    const inst = this.proto._resolveTypeNesting([type, opts])
    inst.write(buf.slice(off), val)
    return off + inst.sizeWrite(buf)
  }

  sizeOf (val, type, opts) {
    return this.proto._resolveTypeNesting([type, opts]).sizeWrite(val)
  }
}

class LegacyDatatype {
  static prepare (...args) {
    return (class extends LegacyDatatype {}).bind(this, ...args)
  }

  constructor (proto, data, args) {
    data = data.map(func => typeof func === 'function' ? func : () => func)
    this.internal = new InternalLegacyDatatype(proto)
    this._read = data[0]
    this._write = data[1]
    this._sizeOf = data[2]
    this.args = args
  }

  read (buf) { return this._read.call(this.internal, buf, 0, this.args).value }
  write (buf, val) { this._write.call(this.internal, val, buf, 0, this.args) }
  sizeRead (buf) { return this._read.call(this.internal, buf, 0, this.args).size }
  sizeWrite (val) { return this._sizeOf.call(this.internal, val, this.args) }
}
