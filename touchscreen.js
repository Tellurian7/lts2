/**
 * Lib for Touch Screen reading
 * @author Ryan Gilles <tellurian_7@hotmail.com>
 */

var FS = require("fs");
var execSync = require('child_process').execSync;
var EventEmitter = require('events').EventEmitter;

var lib = {};

/**
 * Touch Screen Input
 * @param {Object} config
 * @class
 * @return {touchscreen_input}
 */
lib.touchscreen_input = function(config)
{
	this.wrap('_onOpen');
	this.wrap('_onRead');
	
	this.config = config;
	
	if (this.config.debug === undefined)
		this.config.debug = false;
	
	this._fd = 0;
	this._position_x = 0;
	this._position_y = 0;
	this._old_position_x = 0;
	this._old_position_y = 0;

	this._buffer = new Buffer(16);
	
	// Detect event input file
	
	var devices_file = execSync('cat /proc/bus/input/devices').toString();
	var devices_data = devices_file.split("\n\n");
	
	var e = "event", line;
	
	for (i in devices_data)
	{
		line = devices_data[i];
		
		if (line.indexOf('Name="' + config.device_name + '"') > 0)
		{
			this.config.device = '/dev/input/' + line.substring(line.indexOf(e), line.indexOf(e) + (e.length + 2)).trim();
			
			if (!FS.existsSync(this.config.device))
				throw 'Touchscreen : Can\'t find event file ' + this.config.device;
			
			if (this.config.debug)
				console.log('Touchscreen : Device event file found : ' + this.config.device);
			
			return;
		}
	}
	
	throw 'Touchscreen : Can\'t find device named "' + config.device_name + '"';
}

lib.touchscreen_input.prototype = Object.create(EventEmitter.prototype, {
	constructor: {value: lib.touchscreen_input}
});

lib.touchscreen_input.prototype.wrap = function(name) {
	var self = this;
	var fn = this[name];
	this[name] = function (err) {
		if (err)
			return self.emit('error', err);
		return fn.apply(self, Array.prototype.slice.call(arguments, 1));
	};
};

/**
 * Run input handling
 * @param {Function} touchCallback This function will be called anytime the screen is touched/released and coordinates will be sent as paramters in this order : function(position_x, position_y)
 * @param {Function} pressureCallback This function will be called while the screen is touched and coordinates will be sent as paramters in this order : function(position_x, position_y)
 */
lib.touchscreen_input.prototype.run = function (touchCallback, pressureCallback)
{
	FS.open(this.config.device, 'r', this._onOpen);
}

lib.touchscreen_input.prototype._onOpen = function(fd)
{
	this._fd = fd;
	this._startRead();
}

lib.touchscreen_input.prototype._startRead = function()
{
	if (this._fd)
		FS.read(this._fd, this._buffer, 0, 16, null, this._onRead);
}

lib.touchscreen_input.prototype._onRead = function(err, bytesRead)
{
	if (!this._fd)
		return;
	
	var readElement = this._parse(this._buffer);

	if (readElement)
	{
		if (readElement != undefined && readElement.type == 3 && readElement.code == 0 && readElement.val > 0)
			this._position_x = Math.round(((readElement.val - this.config.min_x) / (this.config.max_x - this.config.min_x)) * this.config.res_x);

		if (readElement != undefined && readElement.type == 3 && readElement.code == 1 && readElement.val > 0)
			this._position_y = Math.round(((readElement.val - this.config.min_y) / (this.config.max_y - this.config.min_y)) * this.config.res_y);
		
		if (readElement != undefined && readElement.code == 24)
		{
			//if ((this._position_x != this._old_position_x) || (this._position_y != this._old_position_y))
			//{
				//pressureCallback.call(this, this._position_x, this._position_y);
				this.emit('pressure', this._position_x, this._position_y);
				this._old_position_x = this._position_x;
				this._old_position_y = this._position_y;
			//}
		}
		
		if (readElement != undefined && readElement.code == 330 && readElement.val == 0)
		{
			
			//touchCallback.call(this, this._position_x, this._position_y);
			this.emit('touch', this._position_x, this._position_y);
			this._old_position_x = this._position_x;
			this._old_position_y = this._position_y;

		}
	}
	
	if (this._fd)
		this._startRead();
}

/**
 * Stop input handling
 */
lib.touchscreen_input.prototype.close = function()
{
	try
	{
		FS.close(this._fd);
	} catch (e) {}
	this._fd = undefined;
}

lib.touchscreen_input.prototype._parse = function (buffer)
{
	//if (((buffer.readUInt16LE(10) == 0 || buffer.readUInt16LE(10) == 1) && buffer.readUInt16LE(8) == 3) || (buffer.readUInt16LE(10) == 330 && buffer.readUInt16LE(8) == 1 && buffer.readUInt32LE(12) == 0))
	//{
		return {
			//sec : buffer.readUInt32LE(0),
			//usec: buffer.readUInt32LE(4),
			type: buffer.readUInt16LE(8),
			code: buffer.readUInt16LE(10),
			val:  buffer.readUInt32LE(12)
		}
	//}
}

var exports = module.exports = lib;