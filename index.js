'use strict'
var Transform = require('stream').Transform
var inherits = require('inherits')

function HashBase () {
  Transform.call(this)
  this._finalized = false
}

inherits(HashBase, Transform)

HashBase.DEFAULT_ENCODING = 'buffer'

HashBase.prototype.update = function (data, encoding) {
  if (!Buffer.isBuffer(data)) {
    if (encoding === undefined) encoding = HashBase.DEFAULT_ENCODING
    if (encoding === 'buffer') encoding = 'binary'
    data = new Buffer(data, encoding)
  }

  this._update(data)
  return this
}

HashBase.prototype.digest = function (encoding) {
  // for compatibility with node API
  // see: https://github.com/nodejs/node/blob/c60faf6ba85b6365145fd8215ed572efa9f25fdc/src/node_crypto.cc#L3723
  if (this._finalized) throw new Error('Not initialized')
  this._finalized = true

  var digest = this._digest()
  if (encoding === undefined) encoding = HashBase.DEFAULT_ENCODING
  if (encoding !== 'buffer') digest = digest.toString(encoding)
  return digest
}

HashBase.prototype._update = function (data) {
  throw new Error('_update is not implemented')
}

HashBase.prototype._digest = function () {
  throw new Error('_digest is not implemented')
}

HashBase.prototype._transform = function (chunk, encoding, callback) {
  var error = null
  try {
    if (encoding !== 'buffer') chunk = new Buffer(chunk, encoding)
    this._update(chunk)
  } catch (err) {
    error = err
  }

  callback(error)
}

HashBase.prototype._flush = function (callback) {
  var error = null
  try {
    this.push(this._digest())
  } catch (err) {
    error = err
  }

  callback(error)
}

module.exports = HashBase
