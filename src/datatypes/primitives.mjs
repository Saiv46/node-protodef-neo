export class bool {
  read (buf) { return buf[0] === 1 }
  write (buf, val) { buf[0] = val ? 1 : 0 }
  sizeRead () { return 1 }
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
    let i = 0
    while (buf[i++]) {}
    return i
  }

  sizeWrite (val) { return Buffer.byteLength(val) + 1 }
}
