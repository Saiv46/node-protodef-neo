export class bool {
  static get type () { return Boolean }
  read (buf) { return buf[0] === 1 }
  write (buf, val) { buf[0] = val & 1 }
  sizeRead (buf) { return 1 }
  sizeWrite (val) { return 1 }
}

class Void {
  static get type () { return () => undefined }
  read (buf) {}
  write (buf, val) {}
  sizeRead (buf) { return 0 }
  sizeWrite (val) { return 0 }
}
export { Void as void }

export class cstring {
  static get type () { return String }
  read (buf) { return buf.toString('utf8', 0, this.sizeRead(buf) - 1) }
  write (buf, val) { buf.write(val + '\x00') }
  sizeRead (buf) {
    let i = 0
    while (buf[i++]) {}
    return i
  }
  sizeWrite (val) { return Buffer.byteLength(val) + 1 }
}