// Generated by CoffeeScript 1.8.0
var FileStream, events, fs, os, path,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

fs = require('fs');

path = require('path');

events = require('events');

os = require('options-stream');

FileStream = (function(_super) {
  __extends(FileStream, _super);

  function FileStream(options) {
    this.options = os({
      filePath: '',
      bufferLength: 0,
      mode: '0664'
    }, options);
    this._buffer = [];
    this._newStream();
  }

  FileStream.prototype.write = function(str) {
    this._buffer.push(str);
    if (this._buffer.length > this.options.bufferLength) {
      return this.flush();
    }
  };

  FileStream.prototype.end = function() {
    if (!this.stream) {
      return;
    }
    return this._closeStream();
  };

  FileStream.prototype._newStream = function() {
    var filePath, mode, stream, _ref;
    _ref = this.options, filePath = _ref.filePath, mode = _ref.mode;
    stream = fs.createWriteStream(filePath, {
      flags: 'a',
      mode: mode
    });
    stream.on('error', this.emit.bind(this, 'error'));
    stream.on('open', this.emit.bind(this, 'open'));
    stream.on('close', this.emit.bind(this, 'close'));
    return this.stream = stream;
  };

  FileStream.prototype._closeStream = function() {
    this.flush();
    this.stream.end();
    this.stream.destroySoon();
    return this.stream = null;
  };

  FileStream.prototype.flush = function() {
    if (!this._buffer.length) {
      return;
    }
    this.stream.write(this._buffer.join(''));
    return this._buffer.length = 0;
  };

  return FileStream;

})(events.EventEmitter);

module.exports = function(options) {
  return new FileStream(options);
};
