# Datatypes API


## Datatype
Not a class to extend to, but every datatype must implement these methods:
### read ( buf: **Buffer** ) : **any**
Reads the contents from buffer
### write ( buf: **Buffer**, val: **any** ) : **Void**
Writes contents to buffer and returns undefined
### sizeRead ( buf: **Buffer** ) : **Number**
Must return the number of bytes to read or throw `PartialReadError`
### sizeWrite ( val: **any** ) : **Number**
Must return the number of bytes to write

## ComplexDatatype
A class complex datatypes must extend to.
Has additional methods for internal use.
### [constructor] ( options: **Object|Array|Function|any**, context: **Context** )
In constuctor must call `super(context)` to setup context, in constructor you can pre-compute some values with `options` or construct sub-datatypes.
### constructDatatype ( Data: **Array|Function** ) : **Datatype**
Constructs datatype and returns it

## CountableDatatypes
Extends `ComplexDatatype` to simpily field [counting](https://github.com/ProtoDef-io/ProtoDef/blob/master/doc/datatypes.md#counting).
### [constructor] ( options: **Object|Array|Function|any**, context: **Context** )
In constructor must call `super(options, context)` to setup counting and context. Includes `ComplexDatatype` methods
### readCount ( buf: Buffer )
Reads count from buffer, use `sizeReadCount` before reading contents
### writeCount ( buf: Buffer, val: Number )
Write count in buffer, use `sizeWriteCount` before writing contents
### sizeReadCount ( buf: Buffer )
### sizeWriteCount ( val: Number )

## PartialReadError
Thrown in `sizeRead` method in case if data is cropped/damaged in fail-fast manner.

`read` method should not have these checks for performance reasons.
