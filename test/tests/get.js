'use strict';

var assert = require('assert');

exports.register = function(adapter){
	var Promise = adapter.Promise;

	describe('Promise.prototype.get', function () {
		it('fulfills with right property when promise fulfills', function (done) {
			var promise = new Promise(function(resolve){ resolve({property: 1}) });

			promise.get('property').then(
				function (property) {
					assert.strictEqual(property, 1);
					done();
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				}
			);
		});

		it('fulfills with `undefined` when promise fulfills with object without requested property', function (done) {
			var promise = new Promise(function(resolve){ resolve({}) });

			promise.get('property').then(
				function (property) {
					assert(typeof property === 'undefined');
					done();
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				}
			);
		});

		it('rejects if promise is rejected', function (done) {
			var error = new Error('Rejected');
			var promise = new Promise(function(resolve, reject){ reject(error) });

			promise.get('property').then(
				function (property) {
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
