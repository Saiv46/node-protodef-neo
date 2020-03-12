import { bool, void as Void } from './primitives.mjs'
import { Complex } from './_shared.mjs'

class Switch extends Complex {
  constructor ({ compareTo, compareToValue, fields, default: _default }, context) {
    super(context)
    this.fields = {}
    for (const [compare, type] of Object.entries(fields)) {
      this.fields[compare] = this.constructDatatype(type)
    }
    this.default = this.constructDatatype(_default || Void)
    if (compareTo) {
      this.compare = compareTo
    } else {
      this.compareValue = compareToValue
    }
  }

  _findEqual () {
    const compare = this.compareValue !== undefined
      ? this.compareValue
      : this.context.get(this.compare)
    return this.fields[compare] !== undefined
      ? this.fields[compare]
      : this.default
  }

  read (buf) { return this._findEqual().read(buf) }
  write (buf, val) { this._findEqual().write(buf, val) }
  sizeRead (buf) { return this._findEqual().sizeRead(buf) }
  sizeWrite (val) { return this._findEqual().sizeWrite(val) }
}
export { Switch as switch }

export class option extends Complex {
  constructor ({ type }, context) {
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
    return (this.bool.read(buf) ? this.type.sizeRead(buf.slice(i)) : 0) + i
  }

  sizeWrite (val) {
    const present = val !== undefined && val !== null
    return this.bool.sizeWrite(present) + (present ? this.type.sizeWrite(val) : 0)
  }
}
