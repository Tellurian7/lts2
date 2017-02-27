/**
 * Lib for Info-Beamer programs management with child process
 * @author Ryan Gilles <tellurian_7@hotmail.com>
 */
 
/**
 * Requierments
 */
const spawn = require('child_process').spawn;

/**
 * Constants
 */
const STDOUT_FILTER_REGEX_UPTIME_LINES = [
	/^\W*uptime (\d+s), cpu (\ds\+\ds+), rss (\d+kb), (\d+) objs, (\d+'C)/,
	/[\W*mem\W+fps\W+width\W+height\W+cpu\W+flags\W+name\W+\(alias\)\n-+\n]?\W+(\d+kb)\W+([\d.]+)\W+(\d+)\W+(\d+)\W+([\d.]+%)\W+([\w-]+)/,
	/^-+\W+/,
	/^\W*mem\W+fps\W+width\W+height\W+cpu\W+flags\W+name\W+\(alias\)\W+[-+]?[\W+]?/
];

const STDOUT_FILTER_REGEX_UPTIME_LINES_MONITORING_VARS = [
	['uptime', 'cpu2', 'rss', 'objs', 'temperature'],
	['mem', 'fps', 'width', 'height', 'cpu', 'flags'],
	[],
	[]
];
 
var lib = {};

/**
 * Node
 * @class
 * @param {String} info_beamer_path Path of Info-Beamer software
 * @param {String} node_path Path of the node to execute
 * @return {node}
 */
lib.node = function(info_beamer_path, node_path)
{
	this.info_beamer_path = info_beamer_path;
	this.node_path = node_path;
	
	this.initialized = false;
	this.monitoring = {};
	
	this.initilizationCallback = null;
	this.updateCallback = null;
	this.erroCallback = null;
};

lib.node.prototype.run = function()
{
	var self = this;
	
	this.info_beamer_process = spawn(this.info_beamer_path, [this.node_path], { 'env' : { 'INFOBEAMER_BLANK_MODE' : 'layer'}});
	
	this.info_beamer_process.stdout.on('data', function(data) {self._analyze_stdout(data)});
	this.info_beamer_process.stderr.on('data', function(data) {self._analyze_stdout(data)})

	this.info_beamer_process.on('close', function (code) {
		console.log('Info-Beamer child process exited with code ' + code);
	});
	
	this.info_beamer_process.on('error', function(err) {
		if (typeof(this.errorCallback) == "function")		
			this.errorCallback.call(this, err);
	});
}

/**
 * Try to analyze and decode stdout (or stderr cause Info-Beamer does'nt respect std pipes...)
 * @param {String} data
 */
lib.node.prototype._analyze_stdout = function (data)
{
	if (data === '')
		return;
	
	if (data.toString().trim() == '')
		return;
	
	if (data.toString().indexOf('initialization completed') > 0)
	{
		if (!this.initialized)
		{		
			if (typeof(this.initilizationCallback) == "function")		
				this.initilizationCallback.call(this);
			
			this.initialized = true;
		}
	}
	else
	{
		var reg_ex_found = false;
		
		for (line in STDOUT_FILTER_REGEX_UPTIME_LINES)
		{
			var uptime_first_line_values = data.toString().match(STDOUT_FILTER_REGEX_UPTIME_LINES[line]);
			
			if (uptime_first_line_values != null)
			{			
				try {
					var i = 1;		
					for (var j in STDOUT_FILTER_REGEX_UPTIME_LINES_MONITORING_VARS[line])
					{			
						var monitoring_var = STDOUT_FILTER_REGEX_UPTIME_LINES_MONITORING_VARS[line][j];
						this.monitoring[monitoring_var] = uptime_first_line_values[i];
						i++;
					}
					reg_ex_found = true;
				}
				catch (e)
				{
					// Ignore ...
					console.error('Unexcepted data with REGEX line ' + line + ' : ' + e.message);
					console.log('data = ', data.toString());
					console.log('values = ', uptime_first_line_values);
				}
			}
		}
		
		if (!reg_ex_found)
		{
			console.error('Unknow data from stdout / stderr :', data.toString());
		}
		
		if (typeof(this.updateCallback) == "function")		
			this.updateCallback.call(this, this.monitoring);
	}
};

lib.node.prototype.close = function ()
{
	this.info_beamer_process.stdin.pause();
	this.info_beamer_process.kill();
}

var exports = module.exports = lib;

