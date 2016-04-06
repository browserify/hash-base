'use strict'
var Transform = require('stream').Transform
var inherits = require('inherits')

function HashBase () {
  Transform.call(this)
  this._finalized = false
}

inherits(HashBase, Transform)

HashBase.prototype.update = function (data, encoding) {
  if (this._finalized) throw new Error('Digest already called')
  if (!Buffer.isBuffer(data)) data = new Buffer(data, encoding || 'binary')
  this._update(data)
  return this
}

HashBase.prototype.digest = function (encoding) {
  if (this._finalized) throw new Error('Digest already called')
  this._finalized = true

  var digest = this._digest()
  if (encoding !== undefined) digest = digest.toString(encoding)
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
