'use strict';

var adapter = require('./adapter'),
	fs = require('fs'),
	path = require('path');

var directory = path.resolve(__dirname, 'tests'),
	files = fs.readdirSync(directory);

files.forEach(function(filename){
	if (path.extname(filename) === '.js'){
		var filepath = path.resolve(directory, filename);
		require(filepath).register(adapter);
	}
});
