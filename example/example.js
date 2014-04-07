var Promise = require('../src/promise');

function doSomething(){
	var promise = new Promise(function(resolve, reject, progress){
		function next(){
			progression += 10;

			if (progression == 100){
				clearInterval(interval);
				resolve(progression);
			} else {
				progress(progression);
			}
		}

		var progression = 0,
			interval = setInterval(next, 200);
	});

	return promise;
}

doSomething().then(
	function(){
		console.log('done.');
	},
	function(){
		console.log('error.');
	},
	function(progression){
		console.log(progression + '...');
	}
);
