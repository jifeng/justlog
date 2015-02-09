// Generated by CoffeeScript 1.9.0
var FORMATED_TIME, anonymous, colors, cwd, getFormatedTime, justlogPath, levels, moment, path, pattern, reg, stackNames, stackProcess, timeFormats, timeNames, trackStack,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

moment = require('moment');

colors = require('./colors');

path = require('path');

levels = require('./levels');

cwd = process.cwd();

reg = [/\b(file|lineno|stack|stackColored)\b/, /\b(now|time|date|fulltime|numbertime|mstimestamp|timestamp|moment)\b/, /\(([^\)\(]+?):(\d+):\d+\)$/];

stackNames = ['file', 'lineno', 'stack', 'stackColored'];

timeNames = ['now', 'time', 'date', 'fulltime', 'numbertime', 'mstimestamp', 'timestamp'];

timeFormats = {
  time: 'HH:mm:ss',
  date: 'YYYY-MM-DD',
  fulltime: 'YYYY-MM-DD HH:mm:ss',
  numbertime: 'YYYYMMDDHHmmss'
};

justlogPath = __dirname + '/log' + path.extname(__filename);

anonymous = '<anonymous>';

module.exports = pattern = {

  /*
  /**
   * pre-defined log patterns
   * @type {object}
   *  colored :
   *   - simple-color: log message and colored level text
   *   - simple-nocolor:  like simple without color
   *   - color: tracestack, time, log message and colored level text
   *  nocolor :
   *   - nocolor: like color without color
   *   - event-color: time, log message and colored event
   *  nocolor :
   *   - event-nocolor: like event-color without color
   *   - file : fulltime, tracestack, log message and level text
   *  connect-middleware : ()
   *   - accesslog: apache access-log
   *   - accesslog-rt: like access-log with response-time on the end (with microsecond)
   *   - accesslog-color: like ACCESSLOG-RT with ansi colored
   */
  pre: {
    'simple-nocolor': '{level} {msg}',
    'simple-color': '{color.level level} {msg}',
    'nocolor': '{time} [{levelTrim}] ({stack}) {msg}',
    'color': '{time} {color.level level} {stackColored} {msg}',
    'file': '{fulltime} [{levelTrim}] ({stack}) {msg}',
    'event-color': '{time} {color.event event} {args}',
    'event-nocolor': '{fulltime} {event} {args}',
    'accesslog': '{remote-address} {ident} {user}\n[{now "DD/MMM/YYYY:HH:mm:ss ZZ"}]\n"{method} {url} HTTP/{version}"\n{status} {content-length}\n"{headers.referer}" "{headers.user-agent}"'.replace(/\n/g, ' '),
    'accesslog-rt': '{remote-address} {ident} {user}\n[{now \'DD/MMM/YYYY:HH:mm:ss ZZ\'}]\n"{method} {url} HTTP/{version}"\n{status} {content-length}\n"{headers.referer}" "{headers.user-agent}" {rt}'.replace(/\n/g, ' '),
    'accesslog-color': '{remote-address@yellow} {ident} {user}\n[{now \'DD/MMM/YYYY:HH:mm:ss ZZ\'}]\n"{color.method method} {url@underline,bold,blue} HTTP/{version}"\n{color.status status} {content-length}\n"{headers.referer@blue}" "{headers.user-agent@cyan}" {rt}'.replace(/\n/g, ' '),
    'accesslog-traceid': '{remote-address}:{remote-port} {ident} {user}\n[{now \'DD/MMM/YYYY:HH:mm:ss ZZ\'}]\n"{method} {url} HTTP/{version}"\n{status} {content-length}\n"{headers.referer}" "{headers.user-agent}" {rt} {traceid}'.replace(/\n/g, ' ')
  },

  /*
  /**
   * compile log-format pattern to a render function
   * @param  {string} code pattern string
   * @param  {Object} options on compile; placeholder: placeholder for empty value
   * @return {function}    pattern render function
   *  - {bool}   [trace]   need tracestack info
   *  - {bool}   [time]    need logtime info
   *  - {string} [pattern] pattern text
   */
  compile: function(pat, options) {
    var args, code, func, funcCode, funcs, key, name, placeholder, traceid, useStack, useTime, _i, _len, _ref, _ref1;
    if (options == null) {
      options = {
        placeholder: '-'
      };
    }
    placeholder = options.placeholder, traceid = options.traceid;
    code = (_ref = pattern.pre[pat]) != null ? _ref : pat;
    code = code.replace(/"/g, '\\"');
    useStack = false;
    useTime = false;
    funcs = [];
    code = code.replace(/\{([a-zA-Z][\-\w]+)(?:\.([\w\-]+))?(?:\s([^}@]+?))?(?:@((?:[a-z_]+,?)+))?\}/g, function(match, name, key, args, style) {
      var codes, num, styles, _i, _len;
      if (__indexOf.call(stackNames, name) >= 0) {
        useStack = true;
      }
      if (__indexOf.call(timeNames, name) >= 0) {
        useTime = true;
      }
      codes = [];
      code = '';
      if (style) {
        styles = style.split(',');
      }
      if (styles) {
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          code += colors[style];
        }
        codes.push('"' + code + '"');
      }
      code = '';
      if (args) {
        num = funcs.length;
        funcs.push([name, key, args.replace(/\\"/g, '"')]);
        code = "__func[" + num + "]";
      } else if (name in timeFormats) {
        code += "__vars.now('" + timeFormats[name] + "')";
      } else {
        code += "__vars['" + name + "']" + (key ? "['" + key + "']" : '');
      }
      codes.push("(" + code + "||\"" + placeholder + "\")");
      if (styles) {
        codes.push('"' + colors.reset + '"');
      }
      return '"+\n' + codes.join('+\n') + '+\n"';
    });
    code = ('"' + code + '"').replace(/^""\+$/mg, '');
    code = "return " + (code.trim()) + ";";
    funcCode = [];
    if (funcs.length > 0) {
      funcCode.push('var __func = [];');
      for (_i = 0, _len = funcs.length; _i < _len; _i++) {
        _ref1 = funcs[_i], name = _ref1[0], key = _ref1[1], args = _ref1[2];
        if (args[0].match(/[a-z]/i)) {
          args = "__vars['" + args + "']";
        }
        funcCode.push("__func.push(__vars['" + name + "']" + (key ? "['" + key + "']" : '') + "(" + args + "));");
      }
    }
    code = funcCode.join(";\n") + code;
    func = new Function('__vars', code);
    func.stack = useStack;
    func.time = useTime;
    func.pattern = pat;
    return func;
  },

  /*
  /**
   * render one line
   * @param  {function} render attern render function (generate by .compile())
   * @param  {string]}  msg    log messages
   * @param  {string}   level  log level
   * @return {string}          log line text
   */
  format: function(render, msg, level) {
    if (msg === null) {
      msg = '';
    }
    if (typeof msg !== 'object') {
      msg = {
        msg: msg.toString()
      };
    }
    msg.color = colors;
    msg.level = levels.text[level];
    msg.levelTrim = msg.level.trim();
    if (render.time) {
      msg.now = getFormatedTime;
      msg.mstimestamp = moment().valueOf();
      msg.timestamp = Math.floor(msg.mstimestamp / 1000);
    }
    if (render.stack) {
      msg = trackStack(msg);
    }
    return render(msg) + "\n";
  }
};

FORMATED_TIME = {};

getFormatedTime = function(format) {
  var interval, timer;
  if (!(format in FORMATED_TIME)) {
    interval = 1000;
    timer = function() {
      var now;
      now = moment();
      setTimeout(timer, interval - now.milliseconds());
      return FORMATED_TIME[format] = now.format(format);
    };
    timer();
  }
  return FORMATED_TIME[format];
};

trackStack = function(msg) {
  var err;
  try {
    throw new Error;
  } catch (_error) {
    err = _error;
    return stackProcess(err, msg);
  }
};

stackProcess = function(err, msg) {
  var file, flag, res, stack, stacks, _i, _len;
  stacks = err.stack.split("\n");
  flag = false;
  for (_i = 0, _len = stacks.length; _i < _len; _i++) {
    stack = stacks[_i];
    if (res = stack.match(reg[2])) {
      if (res[1] !== justlogPath && res[1] !== __filename && res[1] !== anonymous) {
        flag = true;
        break;
      }
    }
  }
  if (flag === false) {
    msg.file = 'NULL';
    msg.lineno = 0;
  } else {
    file = res[1];
    msg.file = file[0] === '/' ? path.relative(cwd, file) : file;
    msg.lineno = res[2];
  }
  msg.stack = msg.file + ":" + msg.lineno;
  msg.stackColored = "" + colors.underline + colors.cyan + msg.file + ":" + colors.yellow + msg.lineno + colors.reset;
  return msg;
};
