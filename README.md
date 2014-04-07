<a href="http://promisesaplus.com/">
	<img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo" title="Promises/A+ 1.1 compliant" align="right" />
</a>

Promise.js
==========

Very simple but complete Promise implementation.

* Implements the [Promises/A+ 1.1.0 specification][]:
  - `Promise.prototype.then(onResolve, onReject)`.
* Implements the [ES6 Promise draft][]:
  - `new Promise(function(resolve, reject){})`,
  - `Promise.all(iterable)`,
  - `Promise.race(iterable)`,
  - `Promise.reject(reason)`,
  - `Promise.resolve(value)`,
  - `Promise.prototype.catch(onReject)`.
* Implements some of the earlier proposed features for [Promises/A][]:
  - `Promise.prototype.get(propertyName)`,
  - `Promise.prototype.call(methodName)`,
  - Third optional argument `onProgress` to `then`:
    + `Promise.prototype.then(onResolve, onReject, onProgress)`.
* And to actually be able to use the progress handler:
  - Third argument `progress` for the executor function passed to `new
    Promise`:
    + `new Promise(function(resolve, reject, progress){})`.
* Tests against the [Promises/A+ tests][] as well as some "local" tests
  (most of which are adapted copies if tests found in
  [domenic/promises-unwrapping][]) for the functionality that's not part
  of Promises/A+.

[Promises/A+ 1.1.0 specification]: https://github.com/promises-aplus/promises-spec/blob/1.1.0/README.md
[ES6 Promise draft]: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-objects
[Promises/A]: http://wiki.commonjs.org/wiki/Promises/A
[Promises/A+ tests]: https://github.com/promises-aplus/promises-tests
[domenic/promises-unwrapping]: https://github.com/domenic/promises-unwrapping/tree/master/reference-implementation

Example
=======

```javascript

function get(url){
	var promise = new Promise(function(resolve, reject, progress){
		var request = new XMLHttpRequest();

		request.addEventListener('load', function(){
			if (request.status == 200){
				resolve(request.response);
			} else {
				reject(new Error(request.statusText));
			}
		}, false);

		request.addEventListener('progress', progress, false);
		request.addEventListener('error', reject, false);
		request.addEventListener('abort', reject, false);

		request.open('GET', url, true);
		request.send();
	});
	return promise;
}

get('/some/path').then(
	function(response){
		console.log(response);
	},
	function(reason){
		console.log(reason);
	},
	function(event){
		console.log(event);
	}
);

```
