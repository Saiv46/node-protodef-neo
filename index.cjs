const pack = require('esm')(module)('./src/index.mjs')
module.exports = Object.assign(pack.default, pack)
