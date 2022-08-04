import { Transform } from 'stream'

export class Serializer extends Transform {
  constructor (inst) {
    super({ writableObjectMode: true })
    this.instance = inst
  }

  _transform (val, _, cb) {
    try {
      const buf = Buffer.allocUnsafe(this.instance.sizeWrite(val))
      this.instance.write(buf, val)
      cb(null, buf)
    } catch (e) { cb(e) }
  }
}

export class Deserializer extends Transform {
  constructor (inst) {
    super({ readableObjectMode: true })
    this.instance = inst
  }

  _transform (val, _, cb) {
    try { cb(null, this.instance.read(val)) } catch (e) { cb(e) }
  }
}
