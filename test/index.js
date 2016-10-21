import test from 'tape'
import { randomBytes } from 'crypto'
import HashBase from '../'

function beforeEach (t) {
  const _test = t.test
  t.test = (name, cb) => {
    _test(name, (t) => {
      t.base = new HashBase(64)
      cb(t)
    })
  }
}

test('_transform', (t) => {
  beforeEach(t)

  t.test('should use update', (t) => {
    t.plan(2)
    const buffer = randomBytes(42)
    t.base.update = (data) => t.true(data === buffer)
    t.base._transform(buffer, 'buffer', (err) => t.same(err, null))
    t.end()
  })

  t.test('should pass encoding to update', (t) => {
    t.plan(3)
    t.base.update = (data, encoding) => {
      t.same(data, 'УТФ-8 text')
      t.same(encoding, 'utf8')
    }
    t.base._transform('УТФ-8 text', 'utf8', (err) => t.same(err, null))
    t.end()
  })

  t.test('should handle error in update', (t) => {
    t.plan(1)
    const err = new Error('hey')
    t.base.update = () => { throw err }
    t.base._transform(randomBytes(42), 'buffer', (_err) => t.true(_err === err))
    t.end()
  })

  t.end()
})

test('_flush', (t) => {
  beforeEach(t)

  t.test('should use _digest', (t) => {
    t.plan(2)
    const buffer = randomBytes(42)
    t.base._digest = () => buffer
    t.base.push = (data) => t.true(data === buffer)
    t.base._flush((err) => t.same(err, null))
    t.end()
  })

  t.test('should handle errors in _digest', (t) => {
    t.plan(1)
    const err = new Error('hey')
    t.base._digest = () => { throw err }
    t.base._flush((_err) => t.true(_err === err))
    t.end()
  })

  t.test('should throw "Digest already called" on second _flush call', (t) => {
    const buffer = randomBytes(42)
    t.base._digest = () => buffer
    t.base._flush((err) => t.error(err))
    t.base._flush((err) => t.same(err.message, 'Digest already called'))
    t.same(t.base.read(), buffer)
    t.end()
  })

  t.end()
})

test('update', (t) => {
  beforeEach(t)

  t.test('should return hash instance', (t) => {
    t.same(t.base.update(Buffer.allocUnsafe(63)), t.base)
    t.end()
  })

  t.test('decode string with custom encoding', (t) => {
    t.plan(1)
    const buffer = Buffer.from('УТФ-8 text', 'utf8')
    const base = new HashBase(buffer.length)
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer.toString('utf8'), 'utf8')
    t.end()
  })

  t.test('decode string with utf8 by default', (t) => {
    t.plan(1)
    const buffer = Buffer.alloc(64, 0)
    Buffer.from('УТФ-8', 'utf8').copy(buffer)
    t.base._update = function () { t.same(this._block, buffer) }
    t.base.update(buffer.toString('utf8'))
    t.end()
  })

  t.test('data length is more than 2^32', (t) => {
    t.plan(3)
    const buffer = Buffer.allocUnsafe(1048576)
    const base = new HashBase(1048576)
    base._length = [ 4286578688, 0, 0, 0 ]
    base._update = function () { t.same(this._block, buffer) }
    base.update(buffer)
    base.update(buffer)
    t.same(base._length, [ 8388608, 1, 0, 0 ])
    t.end()
  })

  t.test('call after digest should throw error', (t) => {
    t.base._digest = () => {}
    t.base.digest()
    t.throws(() => {
      t.base.update(Buffer.allocUnsafe(0))
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.end()
})

test('_update', (t) => {
  beforeEach(t)

  t.test('should throw error by default', (t) => {
    t.throws(() => {
      t.base._update()
    }, /^Error: _update is not implemented$/)
    t.end()
  })

  t.end()
})

test('digest', (t) => {
  beforeEach(t)

  t.test('should return buffer from _digest by default', (t) => {
    t.plan(2)
    const buffer = randomBytes(42)
    t.base._digest = () => {
      t.pass()
      return buffer
    }
    t.same(t.base.digest(), buffer)
    t.end()
  })

  t.test('should return buffer by default', (t) => {
    t.base._digest = () => Buffer.from('УТФ-8 text', 'utf8')
    t.same(t.base.digest(), Buffer.from('УТФ-8 text', 'utf8'))
    t.end()
  })

  t.test('should encode result with custom encoding', (t) => {
    t.base._digest = () => Buffer.from('УТФ-8 text', 'utf8')
    t.same(t.base.digest('utf8'), 'УТФ-8 text')
    t.end()
  })

  t.test('second call digest throw error', (t) => {
    t.base._digest = () => {}
    t.base.digest()
    t.throws(() => {
      t.base.digest()
    }, /^Error: Digest already called$/)
    t.end()
  })

  t.end()
})

test('_digest', (t) => {
  beforeEach(t)

  t.test('_digest should throw error by default', (t) => {
    t.throws(() => {
      t.base._digest()
    }, /^Error: _digest is not implemented$/)
    t.end()
  })

  t.end()
})
