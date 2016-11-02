'use strict'
var test = require('tape')
var HashBase = require('../')

var utf8text = 'УТФ-8 text'
var utf8buf = Buffer.from(utf8text, 'utf8')
function noop () {}

function createHashBase (t) { t.base = new HashBase(64) }

function beforeEach (t) {
  var fns = Array.prototype.slice.call(arguments, 1)
  var _test = t.test
  t.test = function (name, callback) {
    _test(name, function (t) {
      for (var i = 0; i < fns.length; ++i) t = fns[i](t) || t
      callback(t)
    })
  }
}

test('HashBase#_transform', function (t) {
  beforeEach(t, createHashBase)

  t.test('should use HashBase#update', function (t) {
    t.plan(3)
    t.base.update = function () {
      t.same(arguments[0], utf8text)
      t.same(arguments[1], 'utf8')
    }
    t.base._transform(utf8text, 'utf8', function (err) {
      t.same(err, null)
    })
    t.end()
  })

  t.test('should handle error in HashBase#update', function (t) {
    t.plan(1)
    var err = new Error('hey')
    t.base.update = function () { throw err }
    t.base._transform(Buffer.allocUnsafe(0), 'buffer', function (_err) {
      t.true(_err === err)
    })
    t.end()
  })

  t.end()
})

test('HashBase#_flush', function (t) {
  beforeEach(t, createHashBase)

  t.test('should use HashBase#digest', function (t) {
    t.plan(2)
    var buffer = Buffer.allocUnsafe(0)
    t.base.push = function (data) { t.true(data === buffer) }
    t.base.digest = function () { return buffer }
    t.base._flush(function (err) { t.same(err, null) })
    t.end()
  })

  t.test('should handle errors in HashBase#digest', function (t) {
    t.plan(1)
    var err = new Error('hey')
    t.base.digest = function () { throw err }
    t.base._flush(function (_err) { t.true(_err === err) })
    t.end()
  })

  t.end()
})

test('HashBase#update', function (t) {
  beforeEach(t, createHashBase)

  t.test('only string or buffer is allowed', function (t) {
    t.throws(function () {
      t.base.update(null)
    }, /^TypeError: Data must be a string or a buffer$/)
    t.end()
  })

  t.test('should throw error after HashBase#digest', function (t) {
    t.base._digest = noop
    t.base.digest()
    t.throws(function () {
      t.base.update('')
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.test('should use HashBase#_update', function (t) {
    t.plan(1)
    t.base._update = t.pass
    t.base.update(Buffer.allocUnsafe(64))
    t.end()
  })

  t.test('default encoding is utf8', function (t) {
    t.plan(1)
    var buffer = Buffer.allocUnsafe(64)
    buffer.fill(0)
    utf8buf.copy(buffer)
    t.base._update = function () { t.same(this._block, buffer) }
    t.base.update(buffer.toString('utf8'))
    t.end()
  })

  t.test('decode string with custom encoding', function (t) {
    t.plan(1)
    var buffer = Buffer.allocUnsafe(64).fill(0x42)
    t.base._update = function () { t.same(this._block, buffer) }
    t.base.update(buffer.toString('hex'), 'hex')
    t.end()
  })

  t.test('data length is more than 2^32 bits', function (t) {
    t.base._length = [ Math.pow(2, 32) - 1, 0, 0, 0 ]
    t.base.update(Buffer.allocUnsafe(1))
    t.same(t.base._length, [ 7, 1, 0, 0 ])
    t.end()
  })

  t.test('should return `this`', function (t) {
    t.same(t.base.update(Buffer.allocUnsafe(0)), t.base)
    t.end()
  })

  t.end()
})

test('HashBase#_update', function (t) {
  beforeEach(t, createHashBase)

  t.test('is not implemented', function (t) {
    t.throws(function () {
      t.base._update()
    }, /^Error: _update is not implemented$/)
    t.end()
  })

  t.end()
})

test('HashBase#digest', function (t) {
  beforeEach(t, createHashBase)

  t.test('should throw error on second call', function (t) {
    t.base._digest = noop
    t.base.digest()
    t.throws(function () {
      t.base.digest()
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.test('should use HashBase#_digest', function (t) {
    t.plan(1)
    t.base._digest = t.pass
    t.base.digest()
    t.end()
  })

  t.test('should return buffer by default', function (t) {
    t.base._digest = function () { return utf8buf }
    t.same(t.base.digest(), utf8buf)
    t.end()
  })

  t.test('should encode result with custom encoding', function (t) {
    t.base._digest = function () { return utf8buf }
    t.same(t.base.digest('utf8'), utf8text)
    t.end()
  })

  t.end()
})

test('HashBase#_digest', function (t) {
  beforeEach(t, createHashBase)

  t.test('is not implemented', function (t) {
    t.throws(function () {
      t.base._digest()
    }, /^Error: _digest is not implemented$/)
    t.end()
  })

  t.end()
})
