// Generated by CoffeeScript 1.4.0
var JustLog, MIN_ROTATE_MS, create, cwd, debug, defaultLogFile, error, events, fs, info, k, levels, mkdirp, moment, os, path, pattern, timeout, util, v, warn, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

fs = require('fs');

path = require('path');

util = require('util');

events = require('events');

moment = require('moment');

mkdirp = require('mkdirp');

os = require('options-stream');

levels = require('./levels');

timeout = require('./timeout');

pattern = require('./pattern');

info = levels.info, debug = levels.debug, warn = levels.warn, error = levels.error;

cwd = process.cwd();

defaultLogFile = "[" + cwd + "/logs/" + (path.basename(path.basename(process.argv[1], '.js'), '.coffee')) + "-]YYYY-MM-DD[.log]";

MIN_ROTATE_MS = 100;

JustLog = (function(_super) {

  __extends(JustLog, _super);

  function JustLog(options) {
    this.options = os({
      encoding: 'utf-8',
      file: {
        level: error | warn,
        pattern: pattern.pre.FILE,
        path: defaultLogFile,
        mode: '0664',
        dir_mode: '2775',
        watcher_timeout: 1000
      },
      stdio: {
        level: error | warn | debug | info,
        pattern: pattern.pre.COLOR,
        stdout: process.stdout,
        stderr: process.stderr
      }
    }, options);
    if (this.options.file.level === 0) {
      this.options.file = false;
    }
    if (this.options.stdio.level === 0) {
      this.options.stdio = false;
    }
    this.file = {
      path: null,
      stream: null,
      timer: null,
      opening: false,
      watcher: null,
      ino: null
    };
    this.closed = false;
    if (this.options.stdio) {
      this.stdout = this.options.stdio.stdout;
      this.stderr = this.options.stdio.stderr;
      this.options.stdio.render = pattern.compile(this.options.stdio.pattern);
    }
    if (this.options.file) {
      this.options.file.render = pattern.compile(this.options.file.pattern);
      this._initFile();
    }
  }

  JustLog.prototype.emit = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    JustLog.__super__.emit.apply(this, args);
    JustLog.__super__.emit.apply(this, ['all'].concat(__slice.call(args)));
  };

  JustLog.prototype._checkFileRenamed = function(cb) {
    var _this = this;
    if (this.options.file === false || this.file.stream === null || this.file.opening === true) {
      cb(null, false);
      return;
    }
    return fs.stat(this.file.path, function(err, stat) {
      var prev;
      if (err) {
        if (err.code === 'ENOENT') {
          cb(null, true);
        } else {
          cb(err);
        }
        return;
      }
      prev = _this.file.ino;
      _this.file.ino = stat.ino;
      if (prev === null || prev === stat.ino) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    });
  };

  JustLog.prototype._checkFile = function() {
    var _this = this;
    this._checkFileRenamed(function(err, changed) {
      if (err) {
        return _this.emit(err);
      }
      if (changed === false) {
        return;
      }
      _this._closeStream();
      _this._newStream();
      _this.emit('rename', _this.file.path);
    });
  };

  JustLog.prototype._setFilePath = function() {
    var filePath;
    filePath = path.normalize(moment().format(this.options.file.path));
    if (path[0] === '/') {
      filePath = path.relative(cwd, filePath);
    }
    return this.file.path = filePath;
  };

  JustLog.prototype._newStream = function() {
    var filePath, stream,
      _this = this;
    filePath = this.file.path;
    try {
      mkdirp.sync(path.dirname(filePath), this.options.file.dir_mode);
    } catch (err) {
      this.emit('error', err);
    }
    this.file.opening = true;
    stream = fs.createWriteStream(filePath, {
      flags: 'a',
      mode: this.options.file.mode
    });
    stream.on('error', this.emit.bind(this));
    stream.on('open', function() {
      _this.file.ino = null;
      return _this.file.opening = false;
    });
    return this.file.stream = stream;
  };

  JustLog.prototype._closeStream = function() {
    this.file.stream.end();
    this.file.stream.destroySoon();
    this.file.stream = null;
  };

  JustLog.prototype._initFile = function() {
    this._setFilePath();
    this._newStream();
    this.file.watcher = setInterval(this._checkFile.bind(this), this.options.file.watcher_timeout);
    return this._rotateFile();
  };

  JustLog.prototype._rotateFile = function() {
    var ms, prev;
    ms = timeout(this.options.file.path)[0];
    if (null === ms) {
      return;
    }
    if (ms <= MIN_ROTATE_MS) {
      ms = MIN_ROTATE_MS;
    }
    if (this.file.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.file.timer = setTimeout(this._rotateFile.bind(this), ms);
    this.emit('timer-start', ms);
    prev = this.file.path;
    this._setFilePath();
    if (prev !== this.file.path) {
      this._closeStream();
      this._newStream();
      this.emit('rotate', prev, this.file.path);
    }
  };

  JustLog.prototype._fileLog = function(msg, level) {
    var line;
    line = pattern.format(this.options.file.render, msg, level);
    return this.file.stream.write(line, this.options.encoding);
  };

  JustLog.prototype._stdioLog = function(msg, level) {
    var line;
    line = pattern.format(this.options.stdio.render, msg, level);
    return (level & (error | warn) ? this.stderr : this.stdout).write(line, this.options.encoding);
  };

  JustLog.prototype._log = function(msg, level) {
    msg = util.format.apply(util, msg);
    if (this.options.file && (this.options.file.level & level)) {
      this._fileLog(msg, level);
    }
    if (this.options.stdio && (this.options.stdio.level & level)) {
      this._stdioLog(msg, level);
    }
    return this;
  };

  JustLog.prototype.info = function() {
    var msg;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this._log(msg, info);
  };

  JustLog.prototype.debug = function() {
    var msg;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this._log(msg, debug);
  };

  JustLog.prototype.warn = function() {
    var msg;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this._log(msg, warn);
  };

  JustLog.prototype.error = function() {
    var msg;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this._log(msg, error);
  };

  JustLog.prototype.close = function(cb) {
    if (this.options.file === false || this.closed) {
      if (cb) {
        process.nextTick(cb);
      }
      return;
    }
    this.closed = true;
    if (cb && this.file.stream) {
      this.file.stream.on('close', cb);
    }
    this._closeStream();
    if (this.file.watcher) {
      clearInterval(this.file.watcher);
      this.file.watcher = null;
    }
    if (this.file.timer) {
      clearTimeout(this.file.timer);
      this.file.timer = null;
    }
  };

  return JustLog;

})(events.EventEmitter);

create = function(options) {
  return new JustLog(options);
};

create.ALL = error | warn | debug | info;

create.EXCEPTION = error | warn;

_ref = levels.levels;
for (k in _ref) {
  v = _ref[k];
  create[k.toUpperCase()] = v;
}

_ref1 = pattern.pre;
for (k in _ref1) {
  v = _ref1[k];
  create[k] = v;
}

module.exports = create;
