const pack = require('esm')(module/*, options*/)('./src/index.mjs')
module.exports = Object.assign(pack.default, pack)
