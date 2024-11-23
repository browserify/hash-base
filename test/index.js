'use strict'

var test = require('tape')
var HashBase = require('../')
var Buffer = require('safe-buffer').Buffer

var utf8text = 'УТФ-8 text'
var utf8buf = Buffer.from(utf8text, 'utf8')
function noop () {}

test('HashBase#_transform', function (t) {
  t.test('should use HashBase#update', function (t) {
    t.plan(3)
    var base = new HashBase(64)
    base.update = function () {
      t.same(arguments[0], utf8text)
      t.same(arguments[1], 'utf8')
    }
    base._transform(utf8text, 'utf8', function (err) {
      t.same(err, null)
    })

    t.end()
  })

  t.test('should handle error in HashBase#update', function (t) {
    t.plan(1)
    var err = new Error('hey')
    var base = new HashBase(64)
    base.update = function () { throw err }
    base._transform(Buffer.allocUnsafe(0), 'buffer', function (_err) {
      t.true(_err === err)
    })

    t.end()
  })

  t.end()
})

test('HashBase#_flush', function (t) {
  t.test('should use HashBase#digest', function (t) {
    t.plan(2)
    var buffer = Buffer.allocUnsafe(0)
    var base = new HashBase(64)
    base.push = function (data) { t.true(data === buffer) }
    base.digest = function () { return buffer }
    base._flush(function (err) { t.same(err, null) })

    t.end()
  })

  t.test('should handle errors in HashBase#digest', function (t) {
    t.plan(1)
    var base = new HashBase(64)
    var err = new Error('hey')
    base.digest = function () { throw err }
    base._flush(function (_err) { t.true(_err === err) })

    t.end()
  })

  t.end()
})

test('HashBase#update', function (t) {
  t.test('only string or buffer is allowed', function (t) {
    var base = new HashBase(64)
    t.throws(function () {
      base.update(null)
    }, /^TypeError: Data must be a string or a buffer$/)
    t.end()
  })

  t.test('should throw error after HashBase#digest', function (t) {
    var base = new HashBase(64)
    base._digest = noop
    base.digest()
    t.throws(function () {
      base.update('')
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.test('should use HashBase#_update', function (t) {
    t.plan(1)

    var base = new HashBase(64)
    base._update = t.pass
    base.update(Buffer.allocUnsafe(64))

    t.end()
  })

  t.test('default encoding is utf8', function (t) {
    t.plan(1)

    var buffer = Buffer.allocUnsafe(64)
    buffer.fill(0)
    utf8buf.copy(buffer)
    var base = new HashBase(64)
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer.toString('utf8'))

    t.end()
  })

  t.test('decode string with custom encoding', function (t) {
    t.plan(1)
    var buffer = Buffer.allocUnsafe(64)
    buffer.fill(0x42)
    var base = new HashBase(64)
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer.toString('hex'), 'hex')

    t.end()
  })

  t.test('data length is more than 2^32 bits', function (t) {
    var base = new HashBase(64)
    base._length = [Math.pow(2, 32) - 1, 0, 0, 0]
    base.update(Buffer.allocUnsafe(1))
    t.same(base._length, [7, 1, 0, 0])

    t.end()
  })

  t.test('should return `this`', function (t) {
    var base = new HashBase(64)
    t.same(base.update(Buffer.allocUnsafe(0)), base)

    t.end()
  })

  t.end()
})

test('HashBase#_update', function (t) {
  t.test('is not implemented', function (t) {
    var base = new HashBase(64)
    t.throws(function () {
      base._update()
    }, /^Error: _update is not implemented$/)
    t.end()
  })

  t.end()
})

test('HashBase#digest', function (t) {
  t.test('should throw error on second call', function (t) {
    var base = new HashBase(64)
    base._digest = noop
    base.digest()
    t.throws(function () {
      base.digest()
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.test('should use HashBase#_digest', function (t) {
    t.plan(1)

    var base = new HashBase(64)
    base._digest = t.pass
    base.digest()

    t.end()
  })

  t.test('should return buffer by default', function (t) {
    var base = new HashBase(64)

    base._digest = function () { return utf8buf }
    t.same(base.digest(), utf8buf)

    t.end()
  })

  t.test('should encode result with custom encoding', function (t) {
    var base = new HashBase(64)
    base._digest = function () { return utf8buf }
    t.same(base.digest('utf8'), utf8text)

    t.end()
  })

  t.end()
})

test('HashBase#_digest', function (t) {
  t.test('is not implemented', function (t) {
    var base = new HashBase(64)
    t.throws(function () {
      base._digest()
    }, /^Error: _digest is not implemented$/)
    t.end()
  })

  t.end()
})
