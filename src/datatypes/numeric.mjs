import { PartialReadError } from './_shared.mjs'

export class Numeric {
  sizeRead (buf) {
    if (buf.length < this.size) { throw new PartialReadError() }
    return this.size
  }

  sizeWrite () { return this.size }
}

class Byte extends Numeric {
  get size () { return 1 }
}
export class i8 extends Byte {
  read (buf) { return buf.readInt8() }
  write (buf, val) { buf.writeInt8(val) }
}
export class u8 extends Byte {
  read (buf) { return buf.readUInt8() }
  write (buf, val) { buf.writeUInt8(val) }
}
export { i8 as li8, u8 as lu8, i8 as bi8, u8 as bu8 }

class Short extends Numeric {
  get size () { return 2 }
}
export class i16 extends Short {
  read (buf) { return buf.readInt16BE() }
  write (buf, val) { buf.writeInt16BE(val) }
}
export class u16 extends Short {
  read (buf) { return buf.readUInt16BE() }
  write (buf, val) { buf.writeUInt16BE(val) }
}
export class li16 extends i16 {
  read (buf) { return buf.readInt16LE() }
  write (buf, val) { buf.writeInt16LE(val) }
}
export class lu16 extends u16 {
  read (buf) { return buf.readUInt16LE() }
  write (buf, val) { buf.writeUInt16LE(val) }
}
export { i16 as bi16, u16 as bu16 }

class Word extends Numeric {
  get size () { return 4 }
}
export class i32 extends Word {
  read (buf) { return buf.readInt32BE() }
  write (buf, val) { buf.writeInt32BE(val) }
}
export class u32 extends Word {
  read (buf) { return buf.readUInt32BE() }
  write (buf, val) { buf.writeUInt32BE(val) }
}
export class f32 extends Word {
  read (buf) { return buf.readFloatBE() }
  write (buf, val) { buf.writeFloatBE(val) }
}
export class li32 extends i32 {
  read (buf) { return buf.readInt32LE() }
  write (buf, val) { buf.writeInt32LE(val) }
}
export class lu32 extends u32 {
  read (buf) { return buf.readUInt32LE() }
  write (buf, val) { buf.writeUInt32LE(val) }
}
export class lf32 extends f32 {
  read (buf) { return buf.readFloatLE() }
  write (buf, val) { buf.writeFloatLE(val) }
}
export { i32 as bi32, u32 as bu32, f32 as bf32 }

class Long extends Numeric {
  get size () { return 8 }
}

export class i64 extends Long {
  // read (buf) { return buf.readBigInt64BE() }
  read (buf) { return [buf.readInt32BE(), buf.readInt32BE(4)] }
  // write (buf, val) { buf.writeBigInt64BE(BigInt(val)) }
  write (buf, val) {
    buf.writeInt32BE(val[0])
    buf.writeInt32BE(val[1], 4)
  }
}
export class u64 extends Long {
  // read (buf) { return buf.readBigUInt64BE() }
  read (buf) { return [buf.readUInt32BE(), buf.readUInt32BE(4)] }
  // write (buf, val) { buf.writeBigUInt64BE(val) }
  write (buf, val) {
    buf.writeUInt32BE(val[0])
    buf.writeUInt32BE(val[1], 4)
  }
}
export class f64 extends Long {
  read (buf) { return buf.readDoubleBE() }
  write (buf, val) { buf.writeDoubleBE(val) }
}
export class li64 extends i64 {
  // read (buf) { return buf.readBigInt64LE() }
  read (buf) { return [buf.readInt32LE(), buf.readInt32LE(4)] }
  // write (buf, val) { buf.writeBigInt64LE(val) }
  write (buf, val) {
    buf.writeInt32LE(val[0])
    buf.writeInt32LE(val[1], 4)
  }
}
export class lu64 extends u64 {
  // read (buf) { return buf.readBigUInt64LE() }
  read (buf) { return [buf.readUInt32LE(), buf.readUInt32LE(4)] }
  // write (buf, val) { buf.writeBigUInt64LE(val) }
  write (buf, val) {
    buf.writeUInt32LE(val[0])
    buf.writeUInt32LE(val[1], 4)
  }
}
export class lf64 extends f64 {
  read (buf) { return buf.readDoubleLE() }
  write (buf, val) { buf.writeDoubleLE(val) }
}
export { i64 as bi64, u64 as bu64, f64 as bf64 }

const INT = Math.pow(2, 31) - 1
const LOG2 = Math.log2(0x7F)
export class varint extends Numeric {
  read (buf) {
    let res = 0
    let i = 0
    while (true) {
      const v = buf[i] | 0
      res += (v & 0x7F) * Math.pow(2, i++ * 7)
      if (v < 0x80) break
    }
    return res
  }

  write (buf, val) {
    let i = 0
    while (val > INT) {
      buf[i++] = (val & 0xFF) | 0x80
      val /= 128
    }
    while (val > 0x7F) {
      buf[i++] = (val & 0xFF) | 0x80
      val >>>= 7
    }
    buf[i] = val | 0
  }

  sizeRead (buf) {
    let i = 0
    while ((buf[i++] | 0) >= 0x80) {}
    if (i === buf.length && (buf[i - 1] | 0) >= 0x80) {
      throw new PartialReadError()
    }
    return i
  }

  sizeWrite (val) {
    return Math.ceil(Math.log2(Math.max(Math.abs(val), 127)) / LOG2)
  }
}
export { varint as lvarint, varint as bvarint }

export class int extends Numeric {
  constructor ({ size, signed }) {
    super()
    this.size = size | 0
    if (signed) { throw new Error('Signed integers not implemented') }
  }

  read (buf) {
    const l = this.size
    let res = 0
    let i = 0
    while (i < l && i < 4) { res += buf[i] << (i++ * 8) }
    while (i < l) { res += buf[i] * Math.pow(2, i++ * 8) }
    return res
  }

  write (buf, val) {
    const l = this.size
    let i = 0
    while (i < l && i < 4) { buf[i] = (val >>> (i++ * 8)) & 0xFF }
    while (i < l) { buf[i] = (val / Math.pow(2, i++ * 8)) & 0xFF }
  }
}
export class lint extends int {
  read (buf) {
    const l = this.size
    let res = 0
    for (let i = 0; i < l; i++) {
      res += buf[l - i - 1] * Math.pow(2, i * 8)
    }
    return res
  }

  write (buf, val) {
    const l = this.size
    for (let i = 0; i < l; i++) {
      buf[l - i - 1] = (val / Math.pow(2, i * 8)) & 0xFF
    }
  }
}
export { int as bint }
