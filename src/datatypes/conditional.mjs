import { bool, void as Void } from './primitives.mjs'
import { Complex } from './_shared.mjs'

class Switch extends Complex {
  constructor ({ compareTo, compareToValue, fields, default: def = Void }) {
    super()
    /** Arguments:
      * compareTo : the value is the other field OR
      * compareToValue : a value is the param itself
      * fields : an object mapping the values to the types
      * default : an optional property saying the type taken
      */
    if (compareTo) {
      this.compareTo = compareTo
    } else {
      this.compareToValue = compareToValue
    }
    this.fields = {}
    for (const name in fields) {
      this.fields[name] = this.constructDatatype(fields[name])
    }
    this.default = this.constructDatatype(def)
  }

  _getType () {
    const value = this.compareToValue !== undefined
      ? this.compareToValue
      : this.context.get(this.compareTo)
    return this.fields[value] || this.default
  }

  read (buf, ctx) { return this._getType().read(buf, ctx) }
  write (buf, val, ctx) { this._getType().write(buf, val, ctx) }
  sizeRead (buf, ctx) { return this._getType().sizeRead(buf, ctx) }
  sizeWrite (val, ctx) { return this._getType().sizeWrite(val, ctx) }
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
