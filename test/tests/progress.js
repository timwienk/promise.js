'use strict';

var assert = require('assert');

exports.register = function(adapter){
	var Promise = adapter.Promise;

	describe('Promise progress handling', function () {
		it('calls the handler with the right arguments', function (done) {
			var argument = {a: 'b'};
			var promiseProgress = null;
			var promise = new Promise(function(resolve, reject, progress){ promiseProgress = progress });

			promise.then(
				function (value) {
					assert(false, 'should never get here');
					done();
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				},
				function (state) {
					assert.strictEqual(state, argument);
					done();
				}
			);

			promiseProgress(argument);
		});

		it('calls handlers multiple times', function (done) {
			var calls = 0;
			var promiseProgress = null;
			var promise = new Promise(function(resolve, reject, progress){ promiseProgress = progress });

			promise.then(
				function (value) {
					assert(false, 'should never get here');
					done();
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				},
				function (state) {
					++calls;
					if (calls == 2) {
						assert(true);
						done();
					}
				}
			);

			promiseProgress();
			promiseProgress();
		});

		it('does not call handlers after promise is resolved', function (done) {
			var promiseProgress = null;
			var called = false;
			var promise = new Promise(function(resolve, reject, progress){ resolve(); promiseProgress = progress });

			promise.then(
				function (value) {
					promiseProgress();
					setTimeout(function(){
						assert.strictEqual(called, false);
						done();
					}, 150);
				},
				function (reason) {
					assert(false, 'should never get here');
					done();
				},
				function (state) {
					called = true;
				}
			);

			promiseProgress();
		});
	});
};
