import { PartialReadError } from './_shared'

export class bool {
  read (buf) { return buf[0] === 1 }
  write (buf, val) { buf[0] = val & 1 }
  sizeRead (buf) {
    if (!buf.length) throw new PartialReadError()
    return 1
  }

  sizeWrite () { return 1 }
}

class Void {
  read () {}
  write () {}
  sizeRead () { return 0 }
  sizeWrite () { return 0 }
}
export { Void as void }

export class cstring {
  read (buf) { return buf.toString(undefined, 0, this.sizeRead(buf) - 1) }
  write (buf, val) { buf[buf.write(val)] = 0 }
  sizeRead (buf) {
    const i = buf.indexOf(0)
    if (i === -1) throw new PartialReadError()
    return i + 1
  }

  sizeWrite (val) { return Buffer.byteLength(val) + 1 }
}
