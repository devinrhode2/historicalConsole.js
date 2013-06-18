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

The resulting console.history array:
```javascript
[
 ['debug', {fooObj: 'O'}, 'asdf', 'caller:function(console) { console.debug(foo, '],
 ['info' , 'function name test' , 'caller:someName']
]
```
Recent history can then be bundled with error reports.
Generating this console.history array is the point of this library.
If you're using Shield js, you call `Shield` in place of `historicalConsole` - so anything that holds for the `console` here of course holds for the console you get there.

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

`caller:null` means a function was called at the global scope (no function called it)

### historicalConsole.noConflict
To play it super safe:
```javascript
myModule.historicalConsole = historicalConsole.noConflict();
```

### Integrate with other things:
Override `console.history.add` with your own callback!
This function is called whenever any `console.*` method is called.
For example, when you call `console.log('foo')`, `console.history.add` will be called with this one argument:
```
['log', 'foo', 'caller:someFunc']
```
Maybe you want to receive all entries and do something interesting wtih them:
```javascript
historicalConsole(function(console) {
  console.history.add = function consoleHistoryCallback(logStatement) {
    //~whateva you want bro~ 
  };
})();
```

The `console.history` array will not exceed 200 entries, or whatever maximum you set:
```javascript
console.options.consoleHistoryMaxLength(100);
```

TODO:
`console.dir`, `profile`, and `profileEnd`

Other functions are exposed on the log object for your flexibility,
if you want to understand and use these, read over the fully commented source below
