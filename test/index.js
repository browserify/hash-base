'use strict';

var test = require('tape');
var HashBase = require('../');
var Buffer = require('safe-buffer').Buffer;

var utf8text = 'УТФ-8 text';
var utf8buf = Buffer.from(utf8text, 'utf8');
function noop() {}

test('HashBase#_transform', function (t) {
	t.test('should use HashBase#update', function (st) {
		st.plan(3);
		var base = new HashBase(64);
		base.update = function () {
			st.same(arguments[0], utf8text);
			st.same(arguments[1], 'utf8');
		};
		base._transform(utf8text, 'utf8', function (err) {
			st.same(err, null);
		});

		st.end();
	});

	t.test('should handle error in HashBase#update', function (st) {
		st.plan(1);
		var err = new Error('hey');
		var base = new HashBase(64);
		base.update = function () { throw err; };
		base._transform(Buffer.allocUnsafe(0), 'buffer', function (_err) {
			st['true'](_err === err);
		});

		st.end();
	});

	t.end();
});

test('HashBase#_flush', function (t) {
	t.test('should use HashBase#digest', function (st) {
		st.plan(2);
		var buffer = Buffer.allocUnsafe(0);
		var base = new HashBase(64);
		base.push = function (data) { st['true'](data === buffer); };
		base.digest = function () { return buffer; };
		base._flush(function (err) { st.same(err, null); });

		st.end();
	});

	t.test('should handle errors in HashBase#digest', function (st) {
		st.plan(1);
		var base = new HashBase(64);
		var err = new Error('hey');
		base.digest = function () { throw err; };
		base._flush(function (_err) { st['true'](_err === err); });

		st.end();
	});

	t.end();
});

test('HashBase#update', function (t) {
	t.test('only string or buffer is allowed', function (st) {
		var base = new HashBase(64);
		st['throws'](function () {
			base.update(null);
		}, /^TypeError: The "data" argument must be a string, a Buffer, a Uint8Array, or a DataView$/);
		st.end();
	});

	t.test('should throw error after HashBase#digest', function (st) {
		var base = new HashBase(64);
		base._digest = noop;
		base.digest();
		st['throws'](function () {
			base.update('');
		}, /^Error: Digest already called$/);
		st.end();
	});

	t.test('should use HashBase#_update', function (st) {
		st.plan(1);

		var base = new HashBase(64);
		base._update = st.pass;
		base.update(Buffer.allocUnsafe(64));

		st.end();
	});

	t.test('default encoding is utf8', function (st) {
		st.plan(1);

		var buffer = Buffer.allocUnsafe(64);
		buffer.fill(0);
		utf8buf.copy(buffer);
		var base = new HashBase(64);
		base._update = function () { st.same(this._block, buffer); };
		base.update(buffer.toString('utf8'));

		st.end();
	});

	t.test('decode string with custom encoding', function (st) {
		st.plan(1);
		var buffer = Buffer.allocUnsafe(64);
		buffer.fill(0x42);
		var base = new HashBase(64);
		base._update = function () { st.same(this._block, buffer); };
		base.update(buffer.toString('hex'), 'hex');

		st.end();
	});

	t.test('data length is more than 2^32 bits', function (st) {
		var base = new HashBase(64);
		base._length = [Math.pow(2, 32) - 1, 0, 0, 0];
		base.update(Buffer.allocUnsafe(1));
		st.same(base._length, [7, 1, 0, 0]);

		st.end();
	});

	t.test('should return `this`', function (st) {
		var base = new HashBase(64);
		st.same(base.update(Buffer.allocUnsafe(0)), base);

		st.end();
	});

	t.test(
		'handle UInt16Array',
		{
			skip: (ArrayBuffer.isView && (Buffer.prototype instanceof Uint8Array || Buffer.TYPED_ARRAY_SUPPORT))
				|| 'ArrayBuffer.isView and TypedArray fully supported'
		},
		function (st) {
			var base = new HashBase(64);

			base._update = noop;
			base.update(new Uint16Array([1234, 512]));
			st.same(base._block.slice(0, base._blockOffset), Buffer.from('d2040002', 'hex'));

			st.end();
		}
	);

	t.end();
});

test('HashBase#_update', function (t) {
	t.test('is not implemented', function (st) {
		var base = new HashBase(64);
		st['throws'](function () {
			base._update();
		}, /^Error: _update is not implemented$/);
		st.end();
	});

	t.end();
});

test('HashBase#digest', function (t) {
	t.test('should throw error on second call', function (st) {
		var base = new HashBase(64);
		base._digest = noop;
		base.digest();
		st['throws'](function () {
			base.digest();
		}, /^Error: Digest already called$/);
		st.end();
	});

	t.test('should use HashBase#_digest', function (st) {
		st.plan(1);

		var base = new HashBase(64);
		base._digest = st.pass;
		base.digest();

		st.end();
	});

	t.test('should return buffer by default', function (st) {
		var base = new HashBase(64);

		base._digest = function () { return utf8buf; };
		st.same(base.digest(), utf8buf);

		st.end();
	});

	t.test('should encode result with custom encoding', function (st) {
		var base = new HashBase(64);
		base._digest = function () { return utf8buf; };
		st.same(base.digest('utf8'), utf8text);

		st.end();
	});

	t.end();
});

test('HashBase#_digest', function (t) {
	t.test('is not implemented', function (st) {
		var base = new HashBase(64);
		st['throws'](function () {
			base._digest();
		}, /^Error: _digest is not implemented$/);
		st.end();
	});

	t.end();
});
