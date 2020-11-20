const pack = require('esm')(module)('./index.mjs')
module.exports = Object.assign(pack.default, pack)
