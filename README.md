# historicalConsole.js

Keep a history of your javascript's console.* calls:

```javascript
historicalConsole(function(console) {
  console.debug(foo, 'asdf');
  (function someName() {
    console.info('function name test');
  })();
})();
```

The resulting console.history:
```javascript
[
 ['debug', {fooObj: 'O'}, 'asdf', 'caller:function(console) { console.debug(foo, '],
 ['info' , 'function name test' , 'caller:someName']
]
```
Recent history can then be bundled with error reports.
Generating this console.history array is the point of this library.

Don't care about `caller:names`? `console.options.addCaller(false)`

### Function naming:
If you don't name your functions (or use coffeescript), I include
the first 40 characters of the function's .toString value.
Change the 40 char snippit length with: console.options.functionSnippetLength(30)

### Track calls to alert:
```javascript
historicalConsole(function(console, alert) {
```

### Globally intercept console calls:
```javascript
historicalConsole(function(console) {
  window.console = console;
});
```

caller:null means a function was called at the global scope (no function called it)

### historicalConsole.noConflict
To play it super safe:
```javascript
myModule.historicalConsole = historicalConsole.noConflict();
```

TODO:
console.dir, profile, and profileEnd

Other functions are exposed on the log object for your flexibility,
if you want to understand and use these, read over the fully commented source below
