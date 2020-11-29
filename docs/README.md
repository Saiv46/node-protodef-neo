# Documentation
* Usage / Examples
* - [Basic example](./usage.example.js)
* - [Streaming](./streaming.example.js)
* - [Custom datatypes](./datatype.example.js)
* API
* - [protodef-neo](#module-protodef-neo)
* - [datatypes](#module-protodef-neo-datatypes)
* - [protodef](#module-protodef-neo-protodef)

## API

### Module `protodef-neo`

* Exports:
* - datatypes (see `Module protodef-neo/datatypes`)
* (see [Protocol](./protocol.md))
* - Interpreter [default]
* - Compiler *(TODO)*
* (see [Datatypes](./datatypes.md))
* - ComplexDatatype
* - CountableDatatype
* - PartialReadError

### Module `protodef-neo/datatypes`
(`protodef-neo/src/datatypes.cjs` for Node <= 12)

All default datatypes from [specification](https://github.com/Saiv46/ProtoDef/blob/master/doc/datatypes.md)

### Module `protodef-neo/protodef`
(`protodef-neo/src/legacy.cjs` for Node <= 12)

Use to replace [`protodef`](https://github.com/ProtoDef-io/node-protodef) in your existing code, note that only these exported classes are backward-compatible:
* ProtoDef
* Serializer
* Parser
* FullPacketParser
