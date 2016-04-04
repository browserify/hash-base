'use strict'
var test = require('tape').test
var HashBase = require('../')

var DEFAULT_ENCODING = HashBase.DEFAULT_ENCODING

function beforeEach (t) {
  var _test = t.test
  t.test = function (name, cb) {
    _test(name, function (t) {
      HashBase.DEFAULT_ENCODING = DEFAULT_ENCODING
      t.base = new HashBase()
      cb(t)
    })
  }
}

test('update', function (t) {
  beforeEach(t)

  t.test('should pass buffer to _update', function (t) {
    t.plan(1)
    var buffer = new Buffer(42)
    t.base._update = function (data) { t.true(buffer === data) }
    t.base.update(buffer)
    t.end()
  })

  t.test('should use DEFAULT_ENCODING', function (t) {
    HashBase.DEFAULT_ENCODING = 'utf-8'
    t.base._update = function (data) { t.same(data, new Buffer('ZЪ', 'utf-8')) }
    t.base.update('ZЪ')
    t.end()
  })

  t.test('should decode string as binary by default', function (t) {
    t.base._update = function (data) { t.same(data, new Buffer('ZЪ', 'binary')) }
    t.base.update('ZЪ')
    t.end()
  })

  t.test('should decode string with custom encoding', function (t) {
    t.base._update = function (data) { t.same(data, new Buffer('ZЪ', 'utf-8')) }
    t.base.update('ZЪ', 'utf-8')
    t.end()
  })

  t.test('should return hash instance', function (t) {
    t.base._update = function () {}
    t.same(t.base.update(new Buffer(42)), t.base)
    t.end()
  })

  t.end()
})

test('decode', function (t) {
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

  t.test('should use DEFAULT_ENCODING', function (t) {
    HashBase.DEFAULT_ENCODING = 'utf-8'
    t.base._digest = function () { return new Buffer('ZЪ', 'utf-8') }
    t.same(t.base.digest(), 'ZЪ')
    t.end()
  })

  t.test('should return buffer by default', function (t) {
    t.base._digest = function () { return new Buffer('ZЪ', 'utf-8') }
    t.same(t.base.digest(), new Buffer('ZЪ', 'utf-8'))
    t.end()
  })

  t.test('should encode result with custom encoding', function (t) {
    t.base._digest = function () { return new Buffer('ZЪ', 'utf-8') }
    t.same(t.base.digest('utf-8'), 'ZЪ')
    t.end()
  })

  t.test('second call digest throw error', function (t) {
    t.base._digest = function () {}
    t.base.digest()
    t.throws(function () {
      t.base.digest()
    }, /^Error: Not initialized$/)
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

test('_transform', function (t) {
  beforeEach(t)

  t.test('should use _update', function (t) {
    t.plan(2)
    var buffer = new Buffer(42)
    t.base._update = function (data) { t.true(data === buffer) }
    t.base._transform(buffer, 'buffer', function (err) {
      t.same(err, null)
    })
    t.end()
  })

  t.test('should decode string with custom encoding', function (t) {
    t.plan(2)
    t.base._update = function (data) { t.same(data, new Buffer('ZЪ', 'utf-8')) }
    t.base._transform('ZЪ', 'utf-8', function (err) {
      t.same(err, null)
    })
    t.end()
  })

  t.test('should handle error in _update', function (t) {
    t.plan(1)
    var err = new Error('hey')
    t.base._update = function () { throw err }
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
