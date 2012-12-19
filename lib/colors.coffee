# ansi colors
esc = '\x1B['
module.exports =
  black      : esc + '30m', bg_black   : esc + '40m'
  red        : esc + '31m', bg_red     : esc + '41m'
  green      : esc + '32m', bg_green   : esc + '42m'
  yellow     : esc + '33m', bg_yellow  : esc + '43m'
  blue       : esc + '34m', bg_blue    : esc + '44m'
  magenta    : esc + '35m', bg_magenta : esc + '45m'
  cyan       : esc + '36m', bg_cyan    : esc + '46m'
  white      : esc + '37m', bg_white   : esc + '47m'
  reset      : esc + '0m'
  bold       : esc + '1m'
  underline  : esc + '4m'


