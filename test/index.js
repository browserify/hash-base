'use strict'
var test = require('tape')
var HashBase = require('../')

function beforeEach (t) {
  var _test = t.test
  t.test = function (name, cb) {
    _test(name, function (t) {
      t.base = new HashBase(64)
      cb(t)
    })
  }
}

test('_transform', function (t) {
  beforeEach(t)

  t.test('should use update', function (t) {
    t.plan(2)
    var buffer = new Buffer(42)
    t.base.update = function (data) { t.true(data === buffer) }
    t.base._transform(buffer, 'buffer', function (err) {
      t.same(err, null)
    })
    t.end()
  })

  t.test('should decode string with custom encoding', function (t) {
    t.plan(2)
    t.base.update = function (data) { t.same(data, new Buffer('УТФ-8 text', 'utf8')) }
    t.base._transform('УТФ-8 text', 'utf8', function (err) {
      t.same(err, null)
    })
    t.end()
  })

  t.test('should handle error in update', function (t) {
    t.plan(1)
    var err = new Error('hey')
    t.base.update = function () { throw err }
    t.base._transform(new Buffer(42), 'buffer', function (_err) {
      t.true(_err === err)
    })
    t.end()
  })

  t.end()
})

test('_flush', function (t) {
  beforeEach(t)

  t.test('should use _digest', function (t) {
    t.plan(2)
    var buffer = new Buffer(42)
    t.base._digest = function () { return buffer }
    t.base.push = function (data) { t.true(data === buffer) }
    t.base._flush(function (err) { t.same(err, null) })
    t.end()
  })

  t.test('should handle errors in _digest', function (t) {
    t.plan(1)
    var err = new Error('hey')
    t.base._digest = function () { throw err }
    t.base._flush(function (_err) { t.true(_err === err) })
    t.end()
  })

  t.end()
})

test('update', function (t) {
  beforeEach(t)

  t.test('should return hash instance', function (t) {
    t.same(t.base.update(new Buffer(63)), t.base)
    t.end()
  })

  t.test('decode string with custom encoding', function (t) {
    t.plan(1)
    var buffer = new Buffer('УТФ-8 text', 'utf8')
    var base = new HashBase(buffer.length)
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer.toString('utf8'), 'utf8')
    t.end()
  })

  t.test('decode string with utf8 by default', function (t) {
    t.plan(1)
    var buffer = new Buffer(64)
    buffer.fill(0)
    new Buffer('УТФ-8', 'utf8').copy(buffer)
    t.base._update = function () { t.same(this._block, buffer) }
    t.base.update(buffer.toString('utf8'))
    t.end()
  })

  t.test('data length is more than 2^32', function (t) {
    t.plan(3)
    var buffer = new Buffer(1048576)
    var base = new HashBase(1048576)
    base._length = [ 4286578688, 0, 0, 0 ]
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer)
    base.update(buffer)
    t.same(base._length, [ 8388608, 1, 0, 0 ])
    t.end()
  })

  t.test('call after digest should throw error', function (t) {
    t.base._digest = function () {}
    t.base.digest()
    t.throws(function () {
      t.base.update(new Buffer(0))
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.end()
})

test('_update', function (t) {
  beforeEach(t)

  t.test('should throw error by default', function (t) {
    t.throws(function () {
      t.base._update()
    }, /^Error: _update is not implemented$/)
    t.end()
  })

  t.end()
})

test('digest', function (t) {
  beforeEach(t)

  t.test('should return buffer from _digest by default', function (t) {
    t.plan(2)
    var buffer = new Buffer(42)
    t.base._digest = function () {
      t.pass()
      return buffer
    }
    t.same(t.base.digest(), buffer)
    t.end()
  })

  t.test('should return buffer by default', function (t) {
    t.base._digest = function () { return new Buffer('УТФ-8 text', 'utf8') }
    t.same(t.base.digest(), new Buffer('УТФ-8 text', 'utf8'))
    t.end()
  })

  t.test('should encode result with custom encoding', function (t) {
    t.base._digest = function () { return new Buffer('УТФ-8 text', 'utf8') }
    t.same(t.base.digest('utf8'), 'УТФ-8 text')
    t.end()
  })

  t.test('second call digest throw error', function (t) {
    t.base._digest = function () {}
    t.base.digest()
    t.throws(function () {
      t.base.digest()
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.end()
})

test('_digest', function (t) {
  beforeEach(t)

  t.test('_digest should throw error by default', function (t) {
    t.throws(function () {
      t.base._digest()
    }, /^Error: _digest is not implemented$/)
    t.end()
  })

  t.end()
})
