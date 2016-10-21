'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream = require('stream');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HashBase = function (_Transform) {
  _inherits(HashBase, _Transform);

  function HashBase(blockSize) {
    _classCallCheck(this, HashBase);

    var _this = _possibleConstructorReturn(this, (HashBase.__proto__ || Object.getPrototypeOf(HashBase)).call(this));

    _this._block = Buffer.allocUnsafe(blockSize);
    _this._blockSize = blockSize;
    _this._blockOffset = 0;
    _this._length = [0, 0, 0, 0];

    _this._finalized = false;
    return _this;
  }

  _createClass(HashBase, [{
    key: '_transform',
    value: function _transform(chunk, encoding, callback) {
      var error = null;
      try {
        this.update(chunk, encoding);
      } catch (err) {
        error = err;
      }

      callback(error);
    }
  }, {
    key: '_flush',
    value: function _flush(callback) {
      var error = null;
      try {
        this.push(this.digest());
      } catch (err) {
        error = err;
      }

      callback(error);
    }
  }, {
    key: '_update',
    value: function _update(data) {
      throw new Error('_update is not implemented');
    }
  }, {
    key: 'update',
    value: function update(data, encoding) {
      if (!Buffer.isBuffer(data) && typeof data !== 'string') throw new TypeError('Data must be a string or a buffer');
      if (this._finalized) throw new Error('Digest already called');
      if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding);

      // consume data
      var block = this._block;
      var offset = 0;
      while (this._blockOffset + data.length - offset >= this._blockSize) {
        for (var i = this._blockOffset; i < this._blockSize;) {
          block[i++] = data[offset++];
        }this._update();
        this._blockOffset = 0;
      }
      while (offset < data.length) {
        block[this._blockOffset++] = data[offset++];
      } // update length
      for (var j = 0, carry = data.length * 8; carry > 0; ++j) {
        this._length[j] += carry;
        carry = this._length[j] / 0x0100000000 | 0;
        if (carry > 0) this._length[j] -= 0x0100000000 * carry;
      }

      return this;
    }
  }, {
    key: '_digest',
    value: function _digest() {
      throw new Error('_digest is not implemented');
    }
  }, {
    key: 'digest',
    value: function digest(encoding) {
      if (this._finalized) throw new Error('Digest already called');
      this._finalized = true;

      var digest = this._digest();
      if (encoding !== undefined) digest = digest.toString(encoding);
      return digest;
    }
  }]);

  return HashBase;
}(_stream.Transform);

exports.default = HashBase;
