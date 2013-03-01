/*
 historicalConsole.js
 Docs: github.com/devinrhode2/historicalConsole.js
*/


//a few global things:
//typeof window in case we're in node.
//==null because it could be falsey zero
if (typeof window !== 'undefined' && window.ie == null) {
  window.ie = (function() {
    /*jshint boss:true, asi: true, expr: true, latedef: true */
    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
      div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
      all[0]
    ){}

    return v > 4 ? v : undef;
  }());
}

(function historicalConsoleJS(window, undefined) {
// Can't do this because we use Function.caller
//'use strict';

  function historicalConsole(fn) {
  
    //validate callback:
    if (Object.prototype.toString.call(fn) != '[object Function]' ||
        arguments.length !== 1 ||
        fn.length !== 1)
    {
      var message = 'historicalConsole expects one function argument like this: ' +
                    'historicalConsole(function(console){/*your whole program*/});';
      alert(message);
      console.error(message + ' You passed in these arguments: ', arguments);
      return;
    }

    //returning a function allows for more flexible use of `historicalConsole`
    return function historicalConsoleClosure() {
      //override global console temporarily so that console.* calls from externals
      //are logged too. This could be developer feedback from external libraries
      //regarding the callbacks use of that library
      var oldConsole = window.console;
      window.console = console;
      try {
        fn(console);
      } catch (e) {
        if (typeof onuncaughtException !== 'undefined') { //probably window.onuncaughtError but maybe not. you can var over it
          onuncaughtException(e);
        } else {
          console.warn(
            'You should define a window.onuncaughtException handler for exceptions,' +
            ' or use a library like Sheild.js'
          );
          throw e;
        }
      } finally { //finally block so we can restore window.console even if we re-throw an error
        window.console = oldConsole;
      }
    };
  }

  //add this to parent historicalConsole since it's common among every instantiated console
  //a 'class' method. prototypes could be used,
  //but I don't think we could do that and have a big clean var console = {...}, which is fast for interpreters
  historicalConsole.resolveFunctionName: function historicalConsole_resolveFunctionName(func) {
    if (!func) {
      return 'null'; //null is when there is not caller (global scope)
    }
    var toString = func.toString()
                    .substring(0, 250) //so the regex doesn't become a performance hog
                    .replace(/\s+/g, ' ');
    //collapse excess whitespace so function snippits for
    //non-named functions are more much more informative

    if (window.ie) {
      func.name = toString
                     //all chars be 'function' and '(' (if there are no chars, then '')
                    .substring(8, toString.indexOf('(', 8)) 
                    .replace(/^\s+|\s+$/g,''); //'function (){' => ' ' becomes the falsey ''
    }
    return func.name || toString.substring(0, internalOptions.functionSnippetLength);
  };

  // Big thanks to @NV for console.js: github.com/NV/console.js
  // saveHooks modify arguments before being saved to console.history
  // the return values are the modified args
  //historicalConsole.saveHooks
  historicalConsole.saveHooks = {
    assert: function console_saveHook_assert(isOk, message) {
      return ['Assertion ' + (isOk ? 'successful' : 'failed') + ': ' + message];
    },
    count: (function() {
      var counters = {};
      return function console_saveHook_count(title) {
        if (!title) {
          //this is the *key* to counters, not the *value*
          title = Math.floor((Math.random() * 100000) + 1).toString();
        }
        if (counters[title]) {
          counters[title]++;
        } else {
          counters[title] = 1;
        }
        return title + ' ' + counters[title];
      };
    })(),
    /*
    //stringifyArguments/_source_of(argument)
    //https://github.com/eriwen/javascript-stacktrace/blob/master/stacktrace.js#L272-L300
    //https://github.com/NV/console.js/blob/gh-pages/console.js#L70-L131
    dir: function console_saveHook_dir() {
      var result = [];
      for (var i = 0; i < arguments.length; i++) {
        result.push(console._source_of(arguments[i], console.dimensions_limit, []));
      }
      return result.join(console._args_separator);
    },
    */
    /*
    //try to glean something from jsperf:
    profile: function console_saveHook_profile() {
    },
    profileEnd: function console_saveHook_profileEnd() {
    },
    */
    time: function console_saveHook_time(name) {
      if (name === undefined) {
        throw new Error('console.time needs a title for your timing like console.time(\'lookup\')');
      }
      startTimes[name] = (new Date()).getTime();
      return [name];
    },
    timeEnd: function console_saveHook_timeEnd(name) {
      return [(name + ': ' + ((new Date()).getTime() - startTimes[name]) + 'ms')];
    },
    timeStamp: function console_saveHook_timeStamp(optionalLabel) {
      return [(new Date()).getTime(), optionalLabel];
    },
    trace: function console_saveHook_trace() {
      return [/*counter?*/ (new Error('console.trace()')).stack || 'stack traces not supported'];
    }
  };

  historicalConsole.noConflict = function historicalConsole_noConflict() {
    window.historicalConsole = _oldHistoricalConsole;
    trackAction('noConflict');
    return historicalConsole;
  };
  var _oldHistoricalConsole = window.historicalConsole;
  window.historicalConsole = historicalConsole;

  //--Done with `historicalConsole`--

  var nativeConsole = window.console;

  //declare as many console properties and methods upfront for optimization
  var console = {
    /**
     * console.generateConsoleMethod(method)
     * takes a method string like 'log' 'error' 'warn' and the rest
     * and returns a function which calls console[method] and logs to history
     *
     * exposed since it's useful externally.
     * This code is essentially the code for console.* methods, ignoring any saveHooks
     * Example values might be: 'log', nativeConsole.log
     */
    //this.generateConsoleMethod
    generateConsoleMethod: function console_generateConsoleMethod(method, nativeMethod, saveHook) {
      return function () { //I fear errors in oldIE, so I'm not naming this function..
        if (nativeMethod) {
          nativeMethod.apply(nativeConsole, arguments);
        }
  
        //convert to real array since not doing so creates a lot of complexity.
        //the potential speed boost of not doing so now is not worth it -devinrhode2
        var args = [].slice.call(arguments);
  
        if (saveHook) {
          args = saveHook.apply(console, args);
        }
  
        //add the method to the begginning so we know what method added the args to console.history
        args.unshift(method);
  
        if (internalOptions.addCaller) {
          try {
            //try to addCaller - separate from above because it may not succeed
            args.push('caller:' + historicalConsole.resolveFunctionName(arguments.callee.caller));
          } catch (e) {
            console.warn(
              'SOMEBODY made a global \'use strict\'; statement. ' +
              'Sheild.js cannot include the caller of this function in strict mode'
            );
          }
        }
  
        console.history.add(args);
      };
    },

    //this.history
    history: [],
    //we don't do console.history = console.history || []
    //because we don't want to inherit other history from another party
 
    //depends on: console.warn
    //this.generateOptionFunction
    generateOptionFunction: function console_generateOptionFunction(optionKey) {
      return function (value) { //I fear errors in oldIE, so I'm not naming this function..
        if (value === undefined) {
          return internalOptions[optionKey];
        } else if (value !== internalOptions[optionKey]) {
          if (typeof value !== typeof internalOptions[optionKey]) {
            console.warn(
              'console.options.' + optionKey + ' is currently type ' + typeof internalOptions[optionKey] +
              ' and you\'re setting it to a ' + typeof value + ' ' + value
            );
          }
          internalOptions[optionKey] = value;
          var optionUpdate = {};
          optionUpdate[optionKey] = value;
          trackAction(optionUpdate); //track all option changes
        }
      };
    },
    options: {}
  };

  // *********************************
  // ** CONSOLE.HISTORY SIZE LIMIT **
  // *********************************
  //this.history.add
  console.history.add = function console_history_add(logStatement) {
    this.push(logStatement);
    if (console.history.length > internalOptions.consoleHistoryMaxLength) {
      console.history.shift();
    }
  };

  // *********************************
  // ** CONSOLE.* METHOD GENERATION **
  // *********************************
  var method;
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  while (length--) {
    method = methods[length];
    // this[method] = this.generateConsoleMethod
    console[method] = console.generateConsoleMethod(
      method,
      nativeConsole[method] || nativeConsole.log,
      historicalConsole.saveHooks[method]
    );
    //if no console method, default to console.log. Thanks to @cowboy:
    //http://benalman.com/projects/javascript-debug-console-log/
  }

  //can't put this in method list because I don't know a clean way to pass in window.alert
  // this.alert
  console.alert = console.generateConsoleMethod('alert', window.alert, function console_alert_saveHook(message) {
    if (typeof onuncaughtException !== 'undefined') {
      onuncaughtException(new Error(message));
    } else {
     console.warn('You should define a window.onuncaughtException handler or use a library like Shield.js')
    }
  });

  // *************
  // ** OPTIONS **
  // *************
  //this.internalOptions
  var internalOptions = {
    addCaller: true,
    functionSnippetLength: 40,
    consoleHistoryMaxLength: 200
  };
  for (var option in internalOptions) {
    if (internalOptions.hasOwnProperty(option)) {
      console.options[option] = console.generateOptionFunction(option);
    }
  }

  //things nobody cares about:
  var startTimes = {}; //for console.time
  //trackAction calls would be removed for the production .min version
  function trackAction(action) {
    //but for now, minifying it may solve the the issue by changing the function name
    if (arguments.callee.name === 'trackAction') {
      if (typeof action !== 'string') {
        action = JSON.stringify(action);
      }
      setTimeout(function() {
        //(new Image()).src = 'http://shieldanalytics.jit.su/log?action=' + action;
      }, 0);
    }
  }

})(this);
