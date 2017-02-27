/**
 * Test for Touch Screen reading
 * @author Ryan Gilles <tellurian_7@hotmail.com>
 */
 
/*
 * Requierments
 */
var touchscreen = require('./touchscreen.js');

var config = {
	device_name : 'ADS7846 Touchscreen',
	min_x : 150,
	min_y : 200,
	max_x : 3950,
	max_y : 3925,
	res_x : 1600,
	res_y : 960,
	debug : true
};

var touchscreen_input = new touchscreen.touchscreen_input(config);

touchscreen_input.on('touch', function(position_x, position_y) {
	console.log('Touched  : x = ' + position_x + ' , y = ' + position_y);
});

touchscreen_input.on('pressure', function(position_x, position_y) {
	console.log('Pressure : x = ' + position_x + ' , y = ' + position_y);
});

touchscreen_input.run();
