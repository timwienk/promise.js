'use strict';

var assert = require('assert');

exports.register = function(adapter){
	require('promises-aplus-tests').mocha(adapter);
};
