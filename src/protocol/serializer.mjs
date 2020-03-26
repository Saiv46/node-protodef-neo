import { Transform } from 'stream' // TODO: Use readable-stream

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

export class Parser extends Transform {
  constructor (inst) {
    super({ readableObjectMode: true })
    this.instance = inst
    this.queue = Buffer.alloc(0)
  }

  _asyncTransform (val) {
    this.queue = Buffer.concat([this.queue, val])
    while (true) {
      try {
        this.push(this.inst.read(this.queue))
        this.queue = this.queue.slice(this.instance.readSize(this.queue))
      } catch (e) {
        if (e.partialReadError) return
        e.buffer = this.queue
        this.queue = Buffer.alloc(0)
        throw e
      }
    }
  }
}
