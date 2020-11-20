import { bool, void as Void } from './primitives.mjs'
import { Complex } from './_shared.mjs'

class Switch extends Complex {
  constructor ({ compareTo, compareToValue, fields, default: def = Void }, context) {
    super(context)
    this.compareMode = compareTo !== undefined && compareToValue === undefined
    this.compareTo = compareTo
    this.compareToValue = compareToValue

    this.fields = {}
    for (const name in fields) {
      this.fields[name] = this.constructDatatype(fields[name])
    }
    this.default = this.constructDatatype(def)
  }

  _getType () {
    const value = this.compareMode
      ? this.context.get(this.compareTo)
      : this.compareToValue
    const field = this.fields[value]
    return field !== undefined ? field : this.default
  }

  read (buf) { return this._getType().read(buf) }
  write (buf, val) { this._getType().write(buf, val) }
  sizeRead (buf) { return this._getType().sizeRead(buf) }
  sizeWrite (val) { return this._getType().sizeWrite(val) }
}
export { Switch as switch }

export class option extends Complex {
  constructor (type, context) {
    super(context)
    this.bool = this.constructDatatype(bool)
    this.type = this.constructDatatype(type)
  }

  read (buf) {
    return this.bool.read(buf)
      ? this.type.read(buf.slice(this.bool.sizeRead(buf)))
      : undefined
  }

  write (buf, val) {
    const present = val !== undefined && val !== null
    this.bool.write(buf, present)
    if (present) this.type.write(buf.slice(this.bool.sizeWrite(present)), val)
  }

  sizeRead (buf) {
    const i = this.bool.sizeRead(buf)
    return i + (this.bool.read(buf) && this.type.sizeRead(buf.slice(i))) | 0
  }

  sizeWrite (val) {
    const present = val !== undefined && val !== null
    return this.bool.sizeWrite(present) + (present && this.type.sizeWrite(val)) | 0
  }
}
