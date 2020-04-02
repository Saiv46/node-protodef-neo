# Protocol API
Both interpreter and compiler extends from `ProtocolInterface`, thus have same methods.

## ProtocolInterface
### [constructor] ( data: **{ types: Object, ...namespaces }** )
Constructs protocol and adds datatypes/namespaces if provided.

### addType ( name: **String**, data: **Function|Array|"native"** ) : this
Adds datatypes to protocol. Chainable.
### addNamespace ( name: **String**, data: **Object** ) : this
Adds namespaces sub-protocol. Chainable.
### read / write / sizeRead / sizeWrite ( name: **String**, ...args )
Aliases for `proto.get(name)[method](...args)`, see [Datatypes](./datatypes.md)

### createSerializer ( name: **String** ) : [Serializer](#serializer)
### createDeserializer ( name: **String** ) : [Deserializer](#deserializer)

## Serializer
### [constructor] ( instance: **Datatype** )
A TransformStream to write serialized data

## Deserializer
### [constructor] ( instance: **Datatype** )
A TransformStream to read serialized data
