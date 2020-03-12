import { void as Void } from './utils.mjs'
import { container } from './structures.mjs'
import { Complex } from './_shared.mjs'

class Switch extends Complex {
  constructor ({ compareTo, compareToValue, fields, default: _default }, context) {
    super(context)
    this.fields = {}
    for (const [ compare, type ] of Object.entries(fields)) {
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

export class option {
  constructor (type, context) {
    this.container = new container([
      { name: 'present', type: 'bool' },
      {
        name: 'valueof',
        type: [
          'switch',
          {
            compareTo: 'present',
            fields: { '1': type }
          }
        ]
      }
    ], context)
  }
  read (buf) { return this.container.read(buf).valueof }
  write (buf, val) { this.container.write(buf, { present: true, valueof: val }) }
  sizeRead (buf) { return this.container.sizeRead(buf) }
  sizeWrite (val) { return this.container.sizeWrite({ present: true, valueof: val }) }
}
