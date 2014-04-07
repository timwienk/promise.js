'use strict';

var assert = require('assert');

exports.register = function(adapter){
	var Promise = adapter.Promise;

	describe('Promise.prototype.call', function () {
		it('fulfills with right return value when promise fulfills', function (done) {
			var promise = new Promise(function(resolve){ resolve({method: function(){ return arguments; }}) });

			promise.call('method', 'arg1', 'arg2').then(
				function (value) {
					assert.strictEqual(value[0], 'arg1');
					assert.strictEqual(value[1], 'arg2');
					assert.strictEqual(value[2], undefined);
					done();
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				}
			);
		});

		it('reject with error when promise fulfills with object without requested method', function (done) {
			var promise = new Promise(function(resolve){ resolve({}) });

			promise.call('method').then(
				function (value) {
					assert(false, 'should never get here');
					done();
				},
				function (reason) {
					assert(reason instanceof Error);
					done();
				}
			);
		});

		it('rejects if promise is rejected', function (done) {
			var error = new Error('Rejected');
			var promise = new Promise(function(resolve, reject){ reject(error) });

			promise.call('method').then(
				function (value) {
					assert(false, 'should never get here');
					done();
				},
				function (reason) {
					assert.strictEqual(reason, error);
					done();
				}
			);
		});
	});
};
