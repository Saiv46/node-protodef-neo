import Interpreter from './protocol/interpreter.mjs'
import {
  Serializer as _Serializer,
  Deserializer as _Deserializer
} from './protocol/serializer.mjs'

// Trying to make it backward-compatible
export class ProtoDef extends Interpreter {
  addType (name, data) {
    if (Array.isArray(data) && data.length === 3) {
      data = LegacyDatatype.prepare(this, data)
    }
    return super.addType(name, data)
  }

  addProtocol (data, path) {
    function get (object, path) {
      if (!path) return
      if (typeof path === 'string') { path = path.split('.') }
      while (path.length) {
        object = object[path.shift()]
        if (object === undefined) break
      }
      return object
    }
    function recursiveAddTypes (protocolData, path) {
      if (protocolData === undefined) return
      if (protocolData.types) { this.addTypes(protocolData.types) }
      recursiveAddTypes.call(this, get(protocolData, path.shift()), path)
    }
    recursiveAddTypes.call(this, data, path)
  }

  addTypes (data) {
    return Object.entries(data).map(v => this.addType(...v), this)
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

  createSerializer (name) { return new Serializer(this.get(name)) }
  createDeserializer (name) { return new FullPacketParser(this.get(name)) }
}

export class Serializer extends _Serializer {
  createPacketBuffer (value) {
    const buffer = Buffer.allocUnsafe(this.instance.sizeWrite(value))
    this.instance.write(buffer, value)
    return buffer
  }

  _transform (val, _, cb) {
    try { cb(null, this.createPacketBuffer(val)) } catch (e) { cb(e) }
  }
}

export class FullPacketParser extends _Deserializer {
  parsePacketBuffer (buffer) {
    const data = this.instance.read(buffer)
    const size = this.instance.sizeRead(buffer)
    return {
      data,
      metadata: { size },
      buffer: buffer.slice(0, size)
    }
  }

  _transform (val, _, cb) {
    try { cb(null, this.parsePacketBuffer(val)) } catch (e) { cb(e) }
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
  static prepare (...args) { return LegacyDatatype.bind(this, ...args) }
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
