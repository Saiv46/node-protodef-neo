import { bool, void as Void } from './primitives.js'
import { Complex } from './_shared.js'

class Switch extends Complex {
  constructor ({ compareTo, compareToValue, fields, default: def = Void }, context) {
    super(context)
    this.compareField = compareTo
    this.compareValue = compareToValue
    this.isComplex = compareTo !== undefined && compareToValue === undefined
    this.compare = this.isComplex
      ? this._compareField
      : this._compareValue

    this.fields = new Map()
    for (const name in fields) {
      this.fields.set(isNaN(name) ? name : +name, this.constructDatatype(fields[name]))
    }
    this.default = this.constructDatatype(def)
  }

  _compareField () { return this.context.get(this.compareField) }
  _compareValue () { return this.compareValue }

  _getType () {
    const value = this.compare()
    return this.fields.has(value) ? this.fields.get(value) : this.default
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
