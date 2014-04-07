'use strict';

var STATE_PENDING = 0,
	STATE_FULFILLED = 1,
	STATE_REJECTED = 2;

function Promise(executor){
	if (!(this instanceof Promise)){
		throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	}

	if (typeof executor !== 'function'){
		throw new TypeError('Promise constructor takes a function argument.');
	}

	this._state = STATE_PENDING;
	this._result = null;
	this._reactions = [];

	try {
		executor(resolve.bind(null, this), reject.bind(null, this), progress.bind(null, this));
	} catch (exception){
		reject(this, exception);
	}
};

module.exports = Promise;


// Instance methods

Promise.prototype.then = function(onFulfilled, onRejected, onProgress){
	if (typeof onFulfilled !== 'function') onFulfilled = 'Identity';
	if (typeof onRejected !== 'function') onRejected = 'Thrower';
	if (typeof onProgress !== 'function') onProgress = 'Identity';

	var promise = new Promise(empty);

	this._reactions.push({
		promise: promise,
		fulfillHandler: onFulfilled,
		rejectHandler: onRejected,
		progressHandler: onProgress
	});

	if (this._state !== STATE_PENDING){
		react(this);
	}

	return promise;
};

Promise.prototype['catch'] = function(onRejected){
	return this.then(null, onRejected);
};

Promise.prototype.get = function(propertyName){
	var promise = new Promise(empty);

	this.then(
		function(value){
			try {
				resolve(promise, value[propertyName]);
			} catch (exception){
				reject(promise, exception);
			}
		},
		function(reason){
			reject(promise, reason);
		},
		function(state){
			progress(promise, state);
		}
	);

	return promise;
};

Promise.prototype.call = function(methodName){
	var promise = new Promise(empty),
		args = Array.prototype.slice.call(arguments, 1);

	this.then(
		function(value){
			try {
				var fn = value[methodName];
				if (typeof fn === 'function'){
					resolve(promise, fn.apply(value, args));
				} else {
					throw new TypeError("Fulfilled value has no method '" + methodName + "'");
				}
			} catch (exception){
				reject(promise, exception);
			}
		},
		function(reason){
			reject(promise, reason);
		},
		function(state){
			progress(promise, state);
		}
	);

	return promise;
};


// Constructor methods

Promise.resolve = function(value){
	var promise;
	if (value instanceof Promise){
		promise = value;
	} else {
		promise = new Promise(empty);
		resolve(promise, value);
	}
	return promise;
};

Promise.reject = function(reason){
	var promise = new Promise(empty);
	reject(promise, reason);
	return promise;
};

Promise.all = function(iterable){
	var promise = new Promise(empty),
		values = [],
		resolved = [],
		length = iterable.length,
		settled = false;

	if (typeof iterable.length === 'undefined'){
		reject(promise, new TypeError('Cannot iterate non-array-like object.'));
	} else {
		if (length > 0){
			for (var i = 0; i < length; ++i){
				resolved[i] = false;
				Promise.resolve(iterable[i]).then(
					function(value){
						if (!settled && resolved[this.index] === false){
							values[this.index] = value;
							resolved[this.index] = true;

							if (resolved.indexOf(false) === -1){
								settled = true;
								fulfill(promise, values);
							} else {
								progress(promise, values);
							}
						}
					}.bind({index: i}),
					function(reason){
						if (!settled){
							settled = true;
							reject(promise, reason);
						}
					}
				);
			}
		} else {
			fulfill(promise, values);
		}
	}

	return promise;
};

Promise.race = function(iterable){
	var promise = new Promise(empty),
		length = iterable.length,
		settled = false;

	if (typeof iterable.length === 'undefined'){
		reject(promise, new TypeError('Cannot iterate non-array-like object.'));
	} else {
		for (var i = 0; i < length; ++i){
			Promise.resolve(iterable[i]).then(
				function(value){
					if (!settled){
						settled = true;
						resolve(promise, value);
					}
				},
				function(reason){
					if (!settled){
						settled = true;
						reject(promise, reason);
					}
				}
			);
		}
	}

	return promise;
};


// Private methods

function empty(){}

function resolve(promise, value){
	if (promise._state === STATE_PENDING){
		if (promise === value){
			reject(promise, new TypeError('Tried to resolve a promise with itself.'));
		} else if (value && (typeof value === 'object' || typeof value === 'function')){
			try {
				var then = value.then;
			} catch (exception){
				reject(promise, exception);
			}
			if (typeof then === 'function'){
				var resolved = false;
				defer(function(){
					try {
						then.call(
							value,
							function(nextValue){
								if (!resolved){
									resolved = true;
									resolve(promise, nextValue);
								}
							},
							function(reason){
								if (!resolved){
									resolved = true;
									reject(promise, reason);
								}
							},
							function(state){
								if (!resolved){
									progress(promise, state);
								}
							}
						);
					} catch (exception){
						if (!resolved){
							resolved = true;
							reject(promise, exception);
						}
					}
				});
			} else {
				fulfill(promise, value);
			}
		} else {
			fulfill(promise, value);
		}
	}
}

function fulfill(promise, value){
	if (promise._state === STATE_PENDING){
		promise._result = value;
		promise._state = STATE_FULFILLED;

		react(promise);
	}
}

function reject(promise, reason){
	if (promise._state === STATE_PENDING){
		promise._result = reason;
		promise._state = STATE_REJECTED;

		react(promise);
	}
}

function progress(promise, state){
	if (promise._state === STATE_PENDING){
		promise._result = state;

		react(promise);
	}
}

function react(promise){
	var state = promise._state,
		result = promise._result,
		reactions = promise._reactions;

	if (state === STATE_FULFILLED || state === STATE_REJECTED) {
		promise._reactions = [];
	}

	defer(handle.bind(null, state, result, reactions));
}

function handle(state, result, reactions){
	var resolveReaction = resolve,
		rejectReaction = reject,
		reactionHandler;

	if (state === STATE_FULFILLED){
		reactionHandler = 'fulfillHandler';
	} else if (state === STATE_REJECTED) {
		reactionHandler = 'rejectHandler';
	} else {
		resolveReaction = progress;
		rejectReaction = progress;
		reactionHandler = 'progressHandler';
	}

	for (var i = 0, l = reactions.length; i < l; ++i){
		var reaction = reactions[i],
			handler = reaction[reactionHandler];

		if (handler === 'Identity'){
			resolveReaction(reaction.promise, result);
		} else if (handler === 'Thrower'){
			rejectReaction(reaction.promise, result);
		} else {
			try {
				resolveReaction(reaction.promise, handler(result));
			} catch (exception){
				rejectReaction(reaction.promise, exception);
			}
		}
	}
}

var defer;
if (typeof process !== 'undefined' && typeof process.nextTick === 'function'){
	defer = process.nextTick;
} else if (typeof setImmediate !== 'undefined'){
	defer = setImmediate;
} else {
	defer = function(fn){
		setTimeout(fn, 0);
	};
}
