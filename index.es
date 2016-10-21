import { Transform } from 'stream'

export default class HashBase extends Transform {
  constructor (blockSize) {
    super()

    this._block = Buffer.allocUnsafe(blockSize)
    this._blockSize = blockSize
    this._blockOffset = 0
    this._length = [0, 0, 0, 0]

    this._finalized = false
  }

  _transform (chunk, encoding, callback) {
    let error = null
    try {
      this.update(chunk, encoding)
    } catch (err) {
      error = err
    }

    callback(error)
  }

  _flush (callback) {
    let error = null
    try {
      this.push(this.digest())
    } catch (err) {
      error = err
    }

    callback(error)
  }

  _update (data) {
    throw new Error('_update is not implemented')
  }

  update (data, encoding) {
    if (!Buffer.isBuffer(data) && typeof data !== 'string') throw new TypeError('Data must be a string or a buffer')
    if (this._finalized) throw new Error('Digest already called')
    if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding)

    // consume data
    const block = this._block
    let offset = 0
    while (this._blockOffset + data.length - offset >= this._blockSize) {
      for (let i = this._blockOffset; i < this._blockSize;) block[i++] = data[offset++]
      this._update()
      this._blockOffset = 0
    }
    while (offset < data.length) block[this._blockOffset++] = data[offset++]

    // update length
    for (let j = 0, carry = data.length * 8; carry > 0; ++j) {
      this._length[j] += carry
      carry = (this._length[j] / 0x0100000000) | 0
      if (carry > 0) this._length[j] -= 0x0100000000 * carry
    }

    return this
  }

  _digest () {
    throw new Error('_digest is not implemented')
  }

  digest (encoding) {
    if (this._finalized) throw new Error('Digest already called')
    this._finalized = true

    let digest = this._digest()
    if (encoding !== undefined) digest = digest.toString(encoding)
    return digest
  }
}
