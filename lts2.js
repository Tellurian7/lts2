/**
 * Live Track Station v 2.0.1 Beta 
 * Program entry point
 * @author Ryan Gilles <tellurian_7@hotmail.com>
 */

/**
 * Requierments
 */
var infobeamer = require('./infobeamer.js');
var touchscreen = require('./touchscreen.js');

var fs = require('fs');
var sleep = require('sleep');
const readline = require('readline');
var usb = require('usb');
var mpg321 = require('mpg321');
var gamepad = require("gamepad");
var midi = require('midi');
var MidiPlayer = require('midi-player-js');
const dgram = require('dgram');
var SerialPort = require('serialport');
/**
 * Program version
 * @const {String}
 */
const VERSION = '2.0.0';


/**
 * Configuration
 * @type {Config}
 */
var config;

/**
 * Current navigation track index
 * @var {number}
 */
var current_navigation_track_index;

/**
 * Current playing track index
 * @var {number}
 */
var current_playing_track_index = -1;

/**
 * Tracks informations
 * @var {Track[]}
 */
var tracks;

/**
 * Samples track player
 * @var {mpg321}
 */
var track_samples_player;

/**
 * Click track player
 * @var {mpg321}
 */
var track_click_player;

/**
 * MIDI tracvk player
 * @var {aplaymidi}
 */
var track_midi_player;

/**
 * MIDI inputs for remote control
 * @var {midi.input}
 */
var midi_input;

/**
 * MIDI ouputs for remote control
 * @var {midi.ouput}
 */
var midi_output;

/**
 * MIDI ouput player
 * {MidiPlayer.Player}
 */
var midi_output_player = null;

/**
 * @var {object} Informations about current samples file playback (refresh at every frame)
 * @property {number} current_frame Curent frame number
 * @property {number} frames_remaining Current frames remaining until playback end
 * @property {number} current_time Current playback time in seconds
 * @property {number} time_remaining Current time remaining until playback end, in seconds
 */
var samples_playback_frame_infos = {
	current_frame : 0,
	frames_remaining : 0,
	current_time : 0,
	time_remaining : 0
};

/**
 * Show playing progress (Holding gamepad button set it to true)
 * @var {boolean}
 */
var show_playing_progress = false;

/**
 * Handler for show_playing_progress interval
 * @var {object}
 */
var show_playing_progress_handler;

/**
 * Jump to this specified frame when samples playback is ready and getting frame informations
 * @var {number}
 */
var samples_jump_to_frame = -1;

/**
 * Touch Screen inputs handler
 * @var {touchscreen_input}
 */
var touchscreen_input;

/**
 * Arduino serial port handler
 */
var arduino_port;

/**
 * Load configuration file ./configuration.json
 */
function loadConfiguration()
{
	var configuration_file_path = __dirname + '/configuration.json';
		
	// Access and file exist check
	
	try 
	{
		fs.accessSync(configuration_file_path, fs.constants.R_OK);
	}
	catch (e)
	{
		console.error('Can\'t access to file ' + configuration_file_path + ' or file doesn\'t exist');
		process.exit(1);
	}
	
	// File read
	
	try
	{
		var config_data = fs.readFileSync(configuration_file_path);
	}
	catch (e)
	{
		console.error('Can\'t read file ' + configuration_file_path);
		process.exit(1);
	}

	try
	{
		config = JSON.parse(config_data);
	}
	catch (e)
	{
		console.error('Can\'t parse configuration JSON file ' + configuration_file_path);
		process.exit(1);
	}
}

/**
 * Print error lines
 * @param {String[]} lines Error lines
 * @param {Number} screen_uwait usleep Value to wait between each screens
 */
function renderingError(lines, screen_uwait)
{
	if (screen_uwait === undefined)
		screen_uwait = 1000 * 1000 * 2.5; // 2.5 seconds
	
	// @todo Error display
	/*
	lcd.on();
	lcd.clear();
	lcd.home();
	
	var screen_line = 1;
	
	for (l in lines)
	{
		lcdPrintLineCentered(lines[l], screen_line);
		screen_line++;
		
		if ((screen_line == 3) && (l != lines.length - 1))
		{
			sleep.usleep(screen_uwait);
			lcd.clear();
			screen_line = 1;
		}
	}
	*/
}

/**
 * Run Rendering boot introduction
 */
function renderingIntro()
{
	if (config.debug)
		console.log('Running introduction...')
	
	renderingPrintLineCentered('LiveTrackStation', 1);
	
	// @todo render
	/*
	for (var x = 0 ; x < config.i2c_lcd.lines_width ; x++)
	{
		if (!(x % 2))
		{
			lcd.setCursor(x, 1);
			lcd.writeBlock(LCD_CHARS.MUSIC_NOTE, 1);
		}
	}
	*/
	
	if (!config.skip_timers)
		sleep.sleep(2);
	
	renderingPrintLineCentered(_ljust(' ', 16), 2);
	renderingPrintLineCentered('version ' + VERSION, 2);
	
	if (!config.skip_timers)
		sleep.sleep(2);
	
	//lcd.clear();
}

/**
 * Print text centered in specified line
 * @param {String} s Text to print
 * @param {Number} line Line number
 */
function renderingPrintLineCentered(s, line)
{
	/*var x = Math.ceil((config.i2c_lcd.lines_width - s.length - 1) / 2);

	if (x < 0)
		x = 0;
	*/
	// @todo rendering
	//lcd.setCursor(x, line - 1);
	//lcd.print(s);
}

/**
 * Print progress bar
 * @param {number} percent Progression percentage
 * @param {number} line Line number to print (Default is the last)
 */
function renderingProgressBar(percent, line)
{
	// @todo progress bar
	
	/*
	if (line === undefined)
		line = config.i2c_lcd.lines_count;
	
	lcd.setCursor(0, line - 1);
	if (percent > 0)
		lcd.writeBlock(LCD_CHARS.FULL, 1);
	else
		lcd.writeBlock(LCD_CHARS.PROGRESS_LEFT_EMPTY, 1);
	
	var bar_size = config.i2c_lcd.lines_width - 4;
	
	for (var i = 1 ; i < (bar_size - 1) ; i++)
	{
		lcd.setCursor(i, line - 1);
		
		if (((percent / 100) * bar_size) >= i)
			lcd.writeBlock(LCD_CHARS.FULL, 1);
		else
			lcd.writeBlock(LCD_CHARS.PROGRESS_MIDDLE_EMPTY, 1);
	}
	
	lcd.setCursor(bar_size - 1, line - 1);
	if (((percent / 100) * bar_size) >= i)
		lcd.writeBlock(LCD_CHARS.FULL, 1);
	else
		lcd.writeBlock(LCD_CHARS.PROGRESS_RIGHT_EMPTY, 1);
	
	lcd.setCursor(bar_size, line - 1);
	lcd.print(_rjust(percent.toString(), 3) + '%');
	*/
}


/**
 * Run track playback
 *
 * Stop current playback and run the specified track id / folder name playback
 * Calling this function will set current_track value
 * 
 * @param {Number} index Tracks array index
 */
function playTrack(index)
{
	// Stop current playing track

	if (track_samples_player)
		track_samples_player.stop();

	if (track_click_player)
		track_click_player.stop();

	var track = tracks[index];	
	
	if (config.debug)
	{
		console.log('Play track');
		console.log(track);
	}
	
	var samples_file_path = __dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.samples_file;
	var click_file_path = __dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.click_file;
	
	if (config.debug) 
	{
		console.log('Samples file : "' + samples_file_path + '"');
		console.log('Click file : "' + click_file_path + '"');
	}
	
	if (!config.samples.enabled)
	{
		if (config.debug)
			console.log('Samples playing disabled');		
	}
	else
	{
		var m_samples = new mpg321();
		m_samples.outputdevice('alsa');
		m_samples.audiodevice(config.samples.device);
		
		track_samples_player = m_samples.remote();
		
		track_samples_player.gain(config.samples.gain);
		
		track_samples_player.on('end', function() {
			trackPlayingStop();
		});
		
		track_samples_player.on('frame', function(infos) {
			samples_playback_frame_infos = {
				current_frame : parseInt(infos[0]),
				frames_remaining : parseInt(infos[1]),
				current_time : parseFloat(infos[2]),
				time_remaining : parseFloat(infos[3])
			};
		});
	}
	
	if (!config.click.enabled)
	{
		if (config.debug)
			console.log('Click playing disabled');		
	}
	else
	{
		var m_click = new mpg321();
		m_click.outputdevice('alsa');
		m_click.audiodevice(config.click.device);
		
		track_click_player = m_click.remote();
		
		track_click_player.gain(config.click.gain);
		
		track_click_player.on('end', function() {
			trackPlayingStop();
		});
	}
	
	if (config.samples.enabled)
	{
		track_samples_player.play(samples_file_path);
			
		if (samples_jump_to_frame != -1)
		{
			if (config.debug)
				console.log('Jumping to frame ' + samples_jump_to_frame);
			
			track_samples_player.jump(samples_jump_to_frame);
			samples_jump_to_frame = -1;
		}
		
		track_samples_player.pause();
		
		track_samples_player.gain(config.samples.gain);
	}
	
	if (config.click.enabled)
	{
		track_click_player.play(click_file_path);	
		track_click_player.pause();
		
		track_click_player.gain(config.click.gain);
	}
	
	// Re-sync
	
	if (config.samples.enabled)
		track_samples_player.pause();
	
	if (config.click.enabled)
		track_click_player.pause();
	
	// MIDI tests...
	
	if (!config.midi_output.enabled)
	{
		if (config.debug)
			console.log('MIDI output disabled');
		
		return;
	}
	else
	{
		if (config.debug)
			console.log('MIDI output play...');
	}
	
	if (midi_output)
	{
		midi_output.closePort();
		midi_output = null;
	}
	
	midi_output = new midi.output();
	
	if (midi_output_player)
	{
		midi_output_player.stop();
		midi_output_player = null;
	}
	
	midi_ouptut_player = new MidiPlayer.Player(function(event) {
		
		if ('name' in event)
		{
			switch (event.name)
			{
				case 'Controller Change' :
					//console.log(_rjust(midi_ouptut_player.getCurrentTick().toString(), 6, '0') + ' - ' + 'CC : ' + _ljust(event.number.toString(), 3) + ' ' + _ljust(event.value.toString(), 3) + ' [' + _toHex(event.number, 2) + ' ' + _toHex(event.value, 2) + ']');
					break;
					
				case 'Program Change' :
					//console.log(_rjust(midi_ouptut_player.getCurrentTick().toString(), 6, '0') + ' - ' + 'PC : ' + _ljust(event.delta.toString(), 6), event);
					break;
					
				default :
					//console.log(_rjust(midi_ouptut_player.getCurrentTick().toString(), 6, '0') + ' - ' + event.name + ' :', event);
			}
		}
		else
		{
			//console.log(_rjust(midi_ouptut_player.getCurrentTick().toString(), 6, '0') + ' - ' + 'No Name Event :', event);
		}
		
		if ((midi_output !== null) && ('name' in event))
		{
			var l = '';
			l += 'SEND : TRACK ' + event.track + ' : ' + _ljust((('name' in event) ? event.name : ''), 15) + ' : ';
			l += _ljust(((event.raw.hex.status === null) ? '' : event.raw.hex.status), 2) + ' ';
			l += _ljust(((event.raw.hex.data1 === null) ? '' : event.raw.hex.data1), 2) + ' ';
			l += _ljust(((event.raw.hex.data2 === null) ? '' : event.raw.hex.data2), 2);
			
			if (config.debug)
				console.log(l); 
			
			if ((event.raw.data2 === null) && (event.raw.data1 === null))
				midi_output.sendMessage([event.raw.status]);
			else if ((event.raw.data2 === null))
				midi_output.sendMessage([event.raw.status, event.raw.data1]);
			else
				midi_output.sendMessage([event.raw.status, event.raw.data1, event.raw.data2]);
		}
	});
		
	var ports_count = midi_output.getPortCount();
	
	if (config.debug)
		console.log(ports_count + ' MIDI ouptut ports found :');
	
	var port_number = -1;
	
	for (var i = 0 ; i < ports_count ; i++)
	{
		var port_name = midi_output.getPortName(i);
		
		if (config.debug)
			console.log(' ' + i + ' : ' + port_name);
		
		if (config.midi_output.port_name == port_name)
			port_number = i;
	}
	
	if (port_number == -1)
	{
		console.error('MIDI ouput port name not found !');
		
		renderingError(['Error :', 'No such MIDI out']);
		process.exit(1);
	}
	else
	{
		if (config.debug)
			console.log('MIDI ouput found');
	}
	
	midi_output.openPort(port_number);
	
	midi_ouptut_player.loadFile(__dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.midi_file);
	
	if (config.debug)
		console.log('MIDI file format = ' + midi_ouptut_player.getFormat());
	
	midi_ouptut_player.play();
	
	/*
	track_midi_player = aplaymidi();
	
	var opts = [];
	// File
	opts.push('"' + __dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.midi_file + '"');
	
	// Port
	opts.push('-p ' + config.midi_output.port);
	
	track_midi_player.exec(opts, function(error, stdout, stderr) {
		console.log('callback :');
		console.log('error :', error);
		console.log('stdout :', stdout);
		console.log('stderr :', stderr);
	});
	*/
}

/**
 * Stop playing current track
 */
function stopPlayingTrack()
{
	if (config.debug)
		console.log('Stop playing track');
	
	lts_status.player.infos.playing_track.current_time = '00:00';
	lts_status.player.infos.playing_track.total_time = '00:00';
	sendUdpMessage('infos/playing_track/current_time/set:' + lts_status.player.infos.playing_track.current_time);
	sendUdpMessage('infos/playing_track/total_time/set:' + lts_status.player.infos.playing_track.total_time);
	
	if (track_samples_player)
	{
		track_samples_player.stop();
		track_samples_player.quit();
		track_samples_player = null;
	}
	
	if (track_click_player)
	{
		track_click_player.stop();
		track_click_player.quit();
		track_click_player = null;
	}
	
	if (midi_output)
	{
		midi_output.closePort();
		midi_output = null;
	}
	
	if (midi_output_player !== null)
	{
		midi_output_player.stop();
		
		if (config.debug)
			console.log('Stop MIDI output player');
		
		midi_output_player = null;
	}
}

/**
 * Scan tracks dir sub directory and check track configuration file
 */
function scanTracksDir()
{		
	// Scan directories

	if (config.debug)
		console.log('Scanning tracks directories...');
	
	renderingPrintLineCentered('Scan tracks dir', 1);
	renderingProgressBar(0);
	
	if (!config.skip_timers)
		sleep.sleep(2);

	var path_files = fs.readdirSync(__dirname + '/' + config.tracks_folder);

	var tracks_dirs = [];
	
	renderingPrintLineCentered(' 0 dir(s) found', 1);
	
	if (config.debug)
		console.log(' 0 dir(s) found');
	
	var progress = 0;
	for (var i in path_files)
	{
		var fs_stat = fs.statSync(__dirname + '/' + config.tracks_folder + '/' + path_files[i]);

		if (fs_stat.isDirectory())
		{
			tracks_dirs.push(path_files[i]);
			renderingPrintLineCentered(_rjust(tracks_dirs.length.toString(), 2) + ' dir(s) found', 1);
			
			if (config.debug)
				console.log(_rjust(tracks_dirs.length.toString(), 2) + ' dir(s) found');
		}
		
		progress++;
		renderingProgressBar(Math.ceil(progress / path_files.length * 100));
		
		if (!config.skip_timers)
			sleep.usleep(5000 * 1);
	}
	
	if (!config.skip_timers)
		sleep.sleep(1);
	
	// Check tracks configuration files
	
	if (config.debug)
		console.log('Checking tracks configuration files...');
	
	renderingPrintLineCentered('Check tracks cfg', 1);
	renderingProgressBar(0);
	
	if (!config.skip_timers)
		sleep.usleep(5000 * 100);
	
	tracks = [];
	
	var progress = 0;
	for (var i in tracks_dirs)
	{
		var track_json_path = __dirname + '/' + config.tracks_folder + '/' + tracks_dirs[i] + '/track.json';
		
		// Access and file exist check
		
		try 
		{
			fs.accessSync(track_json_path, fs.constants.R_OK);
		}
		catch (e)
		{
			console.error('Can\'t access to file ' + track_json_path + ' or file doesn\'t exist');
			renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t access to', 'tracks.json !']);
			process.exit(1);
		}
		
		// track.json file read
		
		try
		{
			var track_data = fs.readFileSync(track_json_path);
		}
		catch (e)
		{
			console.error('Can\'t read file ' + track_json_path);
			renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t read', 'tracks.json !']);
			process.exit(1);
		}

		try
		{
			var track_config = JSON.parse(track_data);
		}
		catch (e)
		{
			console.error('Can\'t parse track configuration JSON file ' + track_json_path);
			renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t parse', 'tracks.json !']);
			process.exit(1);
		}
		
		// Check JSON data integrity
		
		var requierd_data = ['title', 'samples_file', 'click_file', 'midi_file'];
		
		for (var j in requierd_data)
		{
			if (!(requierd_data[j] in track_config))
			{
				console.error('Missing "samples_file" in JSON file ' + track_json_path);
				renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Missing data in', 'tracks.json !', '"' + requierd_data[j] + '"', 'is missing']);
				process.exit(1);
			}
		}
		
		/**
		 * Track informations
		 * @var Track
		 */
		var track = track_config;
		
		// Add track folder info
		track.folder = tracks_dirs[i];
		
		// Check track files
		
		if (config.samples.enabled)
		{
			var samples_file_path = __dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.samples_file;
			
			// Access and file exist check
		
			try 
			{
				fs.accessSync(samples_file_path, fs.constants.R_OK);
			}
			catch (e)
			{
				console.error('Can\'t access to file ' + samples_file_path + ' or file doesn\'t exist');
				renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t access to samples file ', track.samples_file]);
				process.exit(1);
			}
			
			// track.json file read
			
			try
			{
				var tmp = fs.readFileSync(samples_file_path);
			}
			catch (e)
			{
				console.error('Can\'t read file ' + samples_file_path);
				renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t read samples file', track.samples_file]);
				process.exit(1);
			}
		}
		
		if (config.click.enabled)
		{
			var click_file_path = __dirname + '/' + config.tracks_folder + '/' + track.folder + '/' + track.click_file;
			
			// Access and file exist check
		
			try 
			{
				fs.accessSync(click_file_path, fs.constants.R_OK);
			}
			catch (e)
			{
				console.error('Can\'t access to file ' + click_file_path + ' or file doesn\'t exist');
				renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t access to click file ', track.click_file]);
				process.exit(1);
			}
			
			// track.json file read
			
			try
			{
				var tmp = fs.readFileSync(click_file_path);
			}
			catch (e)
			{
				console.error('Can\'t read file ' + click_file_path);
				renderingError(['Err in directory', '"' + tracks_dirs[i] + '"', 'Can\'t read click file', track.click_file]);
				process.exit(1);
			}
		}
		
		tracks.push(track);
		
		// @todo check if track files exists

		progress++;
		renderingProgressBar(Math.ceil(progress / tracks_dirs.length * 100));
		
		if (!config.skip_timers)
			sleep.usleep(5000 * 1);
	}
	
	if (!config.skip_timers)
		sleep.sleep(1);
}

/**
 * Convert decimal to hexadecimal string
 * @param {number} d Decimal number
 * @param {number} padding String decimal on hexadecimal result 
 * @return {string}
 */
function _toHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex.toUpperCase();
}

/**
 * Left justify string, adding extra padding chars to fit the width
 * @param {string} s String to manipulate
 * @param {number} width Desired string width
 * @param {string} padding Single char to add
 * @return {string}
 */
function _ljust(s, width, padding) 
{
	padding = padding || " ";
	padding = padding.substr(0, 1);
	if (s.length < width)
		return s + padding.repeat(width - s.length);
	else
		return s;
}

/**
 * Right justify string, adding extra padding chars to fit the width
 * @param {string} s String to manipulate
 * @param {number} width Desired string width
 * @param {string} padding Single char to add
 * @return {string}
 */
function _rjust(s, width, padding) 
{
	padding = padding || " ";
	padding = padding.substr(0, 1);
	if (s.length < width)
		return padding.repeat(width - s.length) + s;
	else
		return s;
}

/**
 * Convert seconds count in "MM:SS" format string
 * @param {number} seconds Seconds count to convert
 * @return {string}
 */
function _secondsToMMSS(seconds)
{
	seconds = Math.round(seconds);
	var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);

    if (hours < 10)
		hours = '0' + hours;
	
    if (minutes < 10)
		minutes = '0' + minutes;
	
	if (seconds < 10)
		seconds = '0' + seconds;
    
	return minutes + ':' + seconds;
}


/**
 * LCD display current playing track informations
 */
function renderingShowPlayingInfos()
{
	//console.log('Rendering : Show playing track informations...');
	
	if (current_playing_track_index == -1)
		return;
	
	if (samples_playback_frame_infos.time_remaining == 0)
		return;
	
	var total_time = Math.round(samples_playback_frame_infos.current_time + samples_playback_frame_infos.time_remaining);
	var total_frames = samples_playback_frame_infos.current_frame + samples_playback_frame_infos.frames_remaining;
	
	var track = tracks[current_playing_track_index];

	lts_status.player.infos.playing_track.current_time = _secondsToMMSS(samples_playback_frame_infos.current_time);
	lts_status.player.infos.playing_track.total_time = _secondsToMMSS(total_time);
	
	sendUdpMessage('infos/playing_track/current_time/set:' + lts_status.player.infos.playing_track.current_time);
	sendUdpMessage('infos/playing_track/total_time/set:' + lts_status.player.infos.playing_track.total_time);
	
	lts_status.player.progress_percent = (samples_playback_frame_infos.current_time / total_time) * 100;
	
	sendUdpMessage('sliders/track/set:' + lts_status.player.progress_percent);

	/*
	lcd.setCursor(0, 0);
	lcd.writeBlock(LCD_CHARS.SPEAKER, 1);
	
	lcd.setCursor(1, 0);
	lcd.writeBlock(LCD_CHARS.MUSIC_NOTE, 1);
	
	lcd.setCursor(2, 0);
	lcd.print(' ' + _secondsToMMSS(samples_playback_frame_infos.current_time) + ' / ' + _secondsToMMSS(total_time));
	*/
}

/**
 * Display specified track playing information
 * @param {Number} index Tracks array index (Use -1 value to print disabled playing informations)
 */
function renderingSetPlayingTrack(index)
{
	if (config.debug)
		console.log('Rendering : Setting playing track to index ' + index + '...');
	
	if (index !== -1)
		var track = tracks[index];
	else
		return;
	
	if (config.debug)
		console.log(track);	
	
	lts_status.player.infos.playing_track.num = index + 1;
	lts_status.player.infos.playing_track.num = _rjust(lts_status.player.infos.playing_track.num.toString(), 2, '0');
	lts_status.player.infos.playing_track.title = track.title;
	sendUdpMessage('infos/playing_track/title/set:' + lts_status.player.infos.playing_track.title);		
	sendUdpMessage('infos/playing_track/num/set:' + lts_status.player.infos.playing_track.num);	
	
	sendUdpMessage('buttons/play_stop/value/set:' + 'stop');
	
	show_playing_progress = true;
					
	showPlayingProgressIntervalFunction = function () {
		if (show_playing_progress)
			renderingShowPlayingInfos();
	};
	
	showPlayingProgressIntervalFunction();
	show_playing_progress_handler = setInterval(showPlayingProgressIntervalFunction, config.show_playing_progress_interval);
}

/**
 * Display specified track information
 * @param {Number} index Tracks array index
 */
function renderingSetNavigationTrack(index)
{
	if (config.debug)
		console.log('Rendering : Setting navigation track to index ' + index + '...');
	
	var track = tracks[index];
	
	if (config.debug)
		console.log(track);	
	
	lts_status.player.infos.tracks.count = _rjust(tracks.length.toString(), 2, '0');
	lts_status.player.infos.navigation_track.title = track.title;
	lts_status.player.infos.navigation_track.num = index + 1;
	lts_status.player.infos.navigation_track.num = _rjust(lts_status.player.infos.navigation_track.num.toString(), 2, '0');

	sendUdpMessage('infos/navigation_track/num/set:' + lts_status.player.infos.navigation_track.num);
	sendUdpMessage('infos/navigation_track/title/set:' + lts_status.player.infos.navigation_track.title);	
}

/**
 * Init tracks navigation
 */
function trackNavigationInit()
{
	if (config.debug)
		console.log('Initializing tracks navigation...');	
	//lcd.clear();
	
	// Define 1st track as current
	
	current_navigation_track_index = 0;	
	current_playing_track_index = -1;
	
	renderingSetPlayingTrack(current_playing_track_index)
	renderingSetNavigationTrack(current_navigation_track_index);
}

/**
 * Move navigation to the previous / left position track
 * @param {Boolean} force Force rendering
 */
function trackNavigationPrevious(force)
{
	if (force === undefined)
		force = false;
	
	if ((current_navigation_track_index == 0) && !force)
		return;
	
	current_navigation_track_index--;
	if (current_navigation_track_index < 0)
		current_navigation_track_index = 0;
	
	renderingSetNavigationTrack(current_navigation_track_index);
}

/**
 * Move navigation to the next / right position track
 * @param {Boolean} force Force rendering
 */
function trackNavigationNext(force)
{
	if (force === undefined)
		force = false;
	
	if ((current_navigation_track_index == (tracks.length - 1)) && !force)
		return;
	
	current_navigation_track_index++;
	if (current_navigation_track_index > (tracks.length - 1))
		current_navigation_track_index = tracks.length - 1;
	
	renderingSetNavigationTrack(current_navigation_track_index);
}

/**
 * Set current navigation track as playing track
 * @param {Boolean} force Force rendering
 */
function trackNavigationSelect(force)
{
	if (force === undefined)
		force = false;
	
	if ((current_navigation_track_index == current_playing_track_index) && !force)
		return;
	
	trackPlayingStop(true);
	
	current_playing_track_index = current_navigation_track_index;
	
	renderingSetPlayingTrack(current_playing_track_index);
	playTrack(current_playing_track_index);
}

/**
 * Stop current playback
 * @param {Boolean} force Force rendering
 */
function trackPlayingStop(force)
{
	if (force === undefined)
		force = false;
	
	if ((current_playing_track_index === -1) && !force)
		return;
	
	current_playing_track_index = -1;
	
	lts_status.player.infos.playing_track.title = '';
	lts_status.player.infos.playing_track.num = '00';
	sendUdpMessage('infos/playing_track/title/set:' + lts_status.player.infos.playing_track.title);	
	sendUdpMessage('infos/playing_track/num/set:' + lts_status.player.infos.playing_track.num);	
	
	sendUdpMessage('buttons/play_stop/value/set:' + 'play');
	
	stopPlayingTrack();
	renderingSetPlayingTrack(current_playing_track_index);
}

/**
 * Set MIDI inputs binding
 */
function processMIDInit()
{
	if (!config.midi_input.enabled)
	{
		if (config.debug)
			console.log('MIDI input disabled');
		return;
	}
	
	if (config.debug)
		console.log('Initializing process MIDI interactions...');
	
	midi_input = new midi.input();
	
	var ports_count = midi_input.getPortCount();
	
	if (config.debug)
		console.log(ports_count + ' MIDI input ports found :');
	
	var port_number = -1;
	
	for (var i = 0 ; i < ports_count ; i++)
	{
		var port_name = midi_input.getPortName(i);
		
		if (config.debug)
			console.log(' ' + i + ' : ' + port_name);
		
		if (config.midi_input.port_name == port_name)
			port_number = i;
	}
	
	if (port_number == -1)
	{
		console.error('MIDI input port name not found !');
		renderingError(['Error :', 'No such MIDI in!']);
		process.exit(1);
	}
	else
	{
		if (config.debug)
			console.log('MIDI input found');
	}
	
	midi_input.on('message', function(deltaTime, message) {
		var m = message.toString().split(',');
		
		var status = null;
		var data1 = null;
		var data2 = null;
		
		if (m[0])
			status = _toHex(m[0], 2);

		if (m[1])
			data1 = _toHex(m[1], 2);

		if (m[2])
			data2 = _toHex(m[2], 2);

		if (config.debug)
			console.log('MIDI input : status=' + status + ', data1=' + data1 + ', data2=' + data2 + ', delta=' + deltaTime);
		
		// Ignore under 0,1 second delta (bug filtering...)
		if (deltaTime < 0.1)
		{
			if (config.debug)
				console.log('Delta is to low, ignore !');
			
			return;
		}
		
		var inputs_names = ['nav_left', 'nav_right', 'play', 'stop'];
		
		for (var i in inputs_names)
		{	
			var input_name = inputs_names[i];
			
			if ((status == config.midi_input[input_name].status) &&
				(data1 == config.midi_input[input_name].data1) &&
				(data2 == config.midi_input[input_name].data2))
			{
				switch (input_name)
				{
					case 'nav_left' :
						trackNavigationPrevious();
						break;

					case 'nav_right' :
						trackNavigationNext();
						break;
					
					case 'play' :
						trackNavigationSelect();
						break;
						
					case 'stop' :
						trackPlayingStop();
						break;
				}
			}
		}
	});
	
	midi_input.openPort(port_number);
	
	midi_input.ignoreTypes(false, false, false);
}

/**
 * Check if all USB devices are connected
 */
function checkUsb()
{
	if (config.debug)
		console.log('Scanning USB devices...');
	
	renderingPrintLineCentered('Scan USB devices', 1);
	renderingProgressBar(0);
	
	var devices = usb.getDeviceList();
	
	for (i in devices)
	{
		var device = devices[i];
		
		if (config.debug)
			console.log(device);
	}	
}

/**
 * Save current playing track id and position
 */
function saveCurrentPlaybackState()
{
	console.log('Saving current playback state in file...');
	
	if (current_playing_track_index == -1)
	{
		console.log('Cancel, no track is currently playing !');
		return;
	}
	
	var track = tracks[current_playing_track_index];
	
	var file_path = __dirname + '/savestat.json';
	
	// Access and file exist check
	
	try 
	{
		fs.accessSync(file_path, fs.constants.W_OK);
	}
	catch (e)
	{
		console.error('Can\'t access to file ' + file_path + ' for writing');
		process.exit(1);
	}
	
	// File write
	
	try
	{

		var data = {
			"track_folder" : track.folder,
			"samples_file_frame" : samples_playback_frame_infos.current_frame
		};
		
		fs.writeFileSync(file_path, JSON.stringify(data));
	}
	catch (e)
	{
		console.error('Can\'t write file ' + file_path);
		process.exit(1);
	}
	
	console.log('Current playback state saved');
}

/**
 * Load playing track id and position from savestat file and restore playback and position
 */
function loadAndRestorePlaybackState()
{
	console.log('Loading playback state in file...');
	
	var file_path = __dirname + '/savestat.json';
	
	// Access and file exist check
	
	try 
	{
		fs.accessSync(file_path, fs.constants.R_OK);
	}
	catch (e)
	{
		console.error('Can\'t access to file ' + file_path + ' or file doesn\'t exist');
		process.exit(1);
	}
	
	// File read
	
	try
	{
		var data = fs.readFileSync(file_path);
	}
	catch (e)
	{
		console.error('Can\'t read file ' + file_path);
		process.exit(1);
	}

	try
	{
		stat = JSON.parse(data);
	}
	catch (e)
	{
		console.error('Can\'t parse savestat JSON file ' + file_path);
		process.exit(1);
	}
	
	// Search stat track folder
	
	var track_id = -1;
	for (i in tracks)
	{
		if (tracks[i].folder == stat.track_folder)
			track_id = i;
	}
	
	if (track_id == -1)
	{
		console.log('Can\'t find save stat track folder !');
		return;
	}
	
	var track = tracks[track_id];
	
	if (config.debug)
	{
		console.log('Save stat track found :');
		console.log(track);
	}
	
	// Set current playing track
	
	trackPlayingStop(true);
	
	current_playing_track_index = track_id;

	if (config.debug)
		console.log('Set save stat playing track (Folder : "' + stat.track_folder + '"');
	
	// Jump to save stat frame
	
	if (config.debug)
		console.log('Set frame jump when playback is rerady (Frame : ' + stat.samples_file_frame + ')');
	
	samples_jump_to_frame = stat.samples_file_frame;
	
	renderingSetPlayingTrack(current_playing_track_index);
	playTrack(current_playing_track_index);
		
	console.log('Playback state restored');
}

/**
 * Initialize Arduino inputs support if enabled
 */
function processArduinoInit() 
{
	if (!config.arduino.enabled)
	{
		if (config.debug)
			console.log('Arduino serial port disabled');
		
		return;
	}
	else
	{
		if (config.debug)
			console.log('Initialize Arduino serial port...');
	}
	
	arduino_port = new SerialPort(config.arduino.usb_port_path);
	
	arduino_port.on('open', function() {
		if (config.debug)
			console.log('Arduino serial port opened');
	});

	arduino_port.on('data', function(buf) {
		var data = buf.toString("utf-8")
		
		if (config.debug)
		{
			console.log(data.trim());
		}
		
		var lines = data.split("\r\n");
		for (var i in lines)
		{
			var ar = lines[i].split('=');
			switch (ar[0])
			{
				case 'A2' :
					lts_status.ear_monitoring.level_percent = parseInt(ar[1]);
					config.click.gain = lts_status.ear_monitoring.level_percent;
					try
					{
						track_click_player.gain(config.click.gain);
					} catch (e) {}	
					sendUdpMessage('knobs/ear_monitoring/set:' + lts_status.ear_monitoring.level_percent);
					break;
					
				case 'A1':
					lts_status.samples_mix.level_percent = parseInt(ar[1]);
					config.samples.gain = lts_status.samples_mix.level_percent;
					try
					{
						track_samples_player.gain(config.samples.gain);
					} catch (e) {}	
					sendUdpMessage('knobs/samples_mix/set:' + lts_status.samples_mix.level_percent);
					break;
			}
		}
	});	
	
	arduino_port.on('error', function(err) {
		console.log('Arduino serial port error : ', err.message);
	});
}

/**
 * Compute distance between two points in 2D
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @return {Number}
 */
function _distance2D(x1, y1, x2, y2)
{
	return (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}

/**
 * Convert degrees to radians
 * @param {Number} deg Degrees
 * @return {Number}
 */
function _degToRad(deg)
{
	return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {Number} rad Radians
 * @return {Number}
 */
function _radToDeg(rad)
{
	return rad * 180 / Math.PI;
}

/**
 * Return true if the point is in the square
 *
 */
function _pointInSquare(point_x, point_y, square_x1, square_y1, square_x2, square_y2)
{
	if (point_x < square_x1 || point_x > square_x2)
		return false;

	if (point_y < square_y1 || point_y > square_y2)
		return false;	
	
	return true;
}

/**
 * Initialize Tousch Screen inputs handler
 */
function processTouchScreenInit()
{
	config.touchscreen.debug = config.debug;
	touchscreen_input = new touchscreen.touchscreen_input(config.touchscreen);
	
	touchscreen_input.on('touch', function(position_x, position_y) {
		/*if (config.debug)
			console.log('Touched  : x = ' + position_x + ' , y = ' + position_y);*/
		
		handleTouchScreen(position_x, position_y, true);		
	});

	touchscreen_input.on('pressure', function(position_x, position_y) {
		/*if (config.debug)
			console.log('Pressure : x = ' + position_x + ' , y = ' + position_y);*/
		
		handleTouchScreen(position_x, position_y, false);
	});
	
	touchscreen_input.on('error', function(err) {
		console.log('Touch Screen error : ', err);
	});
	
	touchscreen_input.run();
}

function handleTouchScreen(position_x, position_y, touch)
{
	// Buttons
	
	if (touch)
	{	
		// Buttons : Previous
		
		if (_pointInSquare(position_x, position_y, config.buttons.previous.x, config.buttons.previous.y, config.buttons.previous.x + config.buttons.previous.w, config.buttons.previous.y + config.buttons.previous.h))
		{
			trackNavigationPrevious();
		}
		
		// Buttons : Play/Stop
		
		if (_pointInSquare(position_x, position_y, config.buttons.play_stop.x, config.buttons.play_stop.y, config.buttons.play_stop.x + config.buttons.play_stop.w, config.buttons.play_stop.y + config.buttons.play_stop.h))
		{
			if (current_playing_track_index > -1)
			{
				// Playing
				trackPlayingStop(1);
			}
			else
			{
				// Stopped
				trackNavigationSelect();
			}
		}
		
		// Buttons : Previous
		
		if (_pointInSquare(position_x, position_y, config.buttons.next.x, config.buttons.next.y, config.buttons.next.x + config.buttons.next.w, config.buttons.next.y + config.buttons.next.h))
		{
			trackNavigationNext();
		}
	}
	
	// Knobs : Ear Monitoring gain level
	
	var dist = _distance2D(position_x, position_y, config.knobs.ear_monitoring.center_x, config.knobs.ear_monitoring.center_y);
	
	if ((dist >= config.knobs.ear_monitoring.touchscreen_min_radius) && (dist <= config.knobs.ear_monitoring.touchscreen_max_radius))
	{
		deg_angle = (Math.atan2(-(position_y - config.knobs.ear_monitoring.center_y), -(position_x - config.knobs.ear_monitoring.center_x)) + Math.PI / 2) * (180 / Math.PI);
		if (deg_angle < 0)
			deg_angle = -(-90-deg_angle) + 270;
		
		if ((deg_angle > config.knobs.ear_monitoring.min_angle) && (deg_angle < config.knobs.ear_monitoring.max_angle))
		{
			percent = ((deg_angle - config.knobs.ear_monitoring.min_angle) / (config.knobs.ear_monitoring.max_angle - config.knobs.ear_monitoring.min_angle)) * 100;
			
			lts_status.ear_monitoring.level_percent = Math.round(percent);
			config.click.gain = lts_status.ear_monitoring.level_percent;
			try
			{
				track_click_player.gain(config.click.gain);
			} catch (e) {}	
			sendUdpMessage('knobs/ear_monitoring/set:' + lts_status.ear_monitoring.level_percent);
		}
	}
	
	// Knobs : Samples Mix gain level
	
	var dist = _distance2D(position_x, position_y, config.knobs.samples_mix.center_x, config.knobs.samples_mix.center_y);
	
	if ((dist >= config.knobs.samples_mix.touchscreen_min_radius) && (dist <= config.knobs.samples_mix.touchscreen_max_radius))
	{
		deg_angle = (Math.atan2(-(position_y - config.knobs.samples_mix.center_y), -(position_x - config.knobs.samples_mix.center_x)) + Math.PI / 2) * (180 / Math.PI);
		if (deg_angle < 0)
			deg_angle = -(-90-deg_angle) + 270;
		
		if ((deg_angle > config.knobs.samples_mix.min_angle) && (deg_angle < config.knobs.samples_mix.max_angle))
		{
			percent = ((deg_angle - config.knobs.samples_mix.min_angle) / (config.knobs.samples_mix.max_angle - config.knobs.samples_mix.min_angle)) * 100;
			
			lts_status.samples_mix.level_percent = Math.round(percent);
			config.samples.gain = lts_status.samples_mix.level_percent;
			try
			{
				track_samples_player.gain(config.samples.gain);
			} catch (e) {}			
			sendUdpMessage('knobs/samples_mix/set:' + lts_status.samples_mix.level_percent);
		}
	}
}

/**
 * Initialize Gamepad interactions
 */
function processGamepadInit()
{
	if (!config.gamepad.enabled)
	{
		if (config.debug)
			console.log('Gamepad disabled');
		
		return;
	}
	else
	{
		if (config.debug)
			console.log('Initialize gamepad...');
	}

	gamepad.init();
	
	if (gamepad.numDevices() == 0)
	{
		console.error('No gamepad detected !');
		renderingError(['Error :', 'No gamepad !']);
		process.exit(1);
	}
	
	// Create a game loop and poll for events 
	setInterval(gamepad.processEvents, 20);
	
	// Listen for move events on all gamepads
	gamepad.on('move', function (id, axis, value){
		if (config.debug)
		{
			console.log('Gamepad move', {
				id: id,
				axis: axis,
				value: value,
			});
		}
		
		if ((id == config.gamepad.device_id) && (axis == config.gamepad.navigation_axis_id))
		{
			if (value > (0.1 * (config.gamepad.reverse_navigation_axis ? -1 : 1)))
			{
				trackNavigationNext();
			}
			else if (value < (-0.1 * (config.gamepad.reverse_navigation_axis ? -1 : 1)))
			{
				trackNavigationPrevious();
			}
			else
			{
				// Dead zone
			}	
		}
	});

	// Listen for button down events on all gamepads
	
	gamepad.on('down', function (id, num) {
		if (config.debug)
		{
			console.log('Gamepad button down', {
				id: id,
				num: num,
			});
		}
		
		if (id == config.gamepad.device_id)
		{
			switch (num)
			{
				case config.gamepad.play_button_id :
					trackNavigationSelect();
					break;
					
				case config.gamepad.stop_button_id :
					trackPlayingStop();
					break;
					
				case config.gamepad.save_current_playback_state_buton_id :
					saveCurrentPlaybackState();
					break;
					
				case config.gamepad.restore_playback_state_buton_id :
					loadAndRestorePlaybackState();
					break;
			}		
		}
	});
	
	// Listen for button up events on all gamepads
	
	gamepad.on('up', function (id, num) {
		if (config.debug)
		{
			console.log('Gamepad button up', {
				id: id,
				num: num,
			});
		}
		
		if (id == config.gamepad.device_id)
		{
			switch (num)
			{
				case config.gamepad.show_playing_progress_button_id :
					show_playing_progress = false;
					clearInterval(show_playing_progress_handler);
					renderingSetPlayingTrack(current_playing_track_index);
					break;
			}		
		}
	});
}


/**/


const udp_client = dgram.createSocket('udp4');

const infobeamer_path = './info-beamer';
const infobeamer_node_path = 'info-beamer-ui-node';
 
var infobeamer_node = new infobeamer.node(infobeamer_path, infobeamer_node_path);

var lts_status = {
	'player' : {
		'progress_percent' : 0,
		'infos' : {
			'tracks' : {
				'count' : "00"
			},
			'navigation_track' : {
				'title' : "",
				'num' : "00",
			},
			'playing_track' : {
				'title' : "",
				'num' : "00",
				'current_time' : "00:00",
				'total_time' : "00:00"
			}
		}
	},
	'ear_monitoring' : {
		'level_percent' : 0
	},
	'samples_mix' : {
		'level_percent' : 0
	}
}

infobeamer_node.initilizationCallback = function() {
	if (config.debug)
		console.log('Info-Beamer initialized');
	
	// Set default values
		
	sendUdpMessage('infos/tracks/count/set:' + lts_status.player.infos.tracks.count);
	sendUdpMessage('infos/navigation_track/title/set:' + lts_status.player.infos.navigation_track.title);
	sendUdpMessage('infos/navigation_track/num/set:' + lts_status.player.infos.navigation_track.num);
	sendUdpMessage('infos/playing_track/title/set:' + lts_status.player.infos.playing_track.title);
	sendUdpMessage('infos/playing_track/num/set:' + lts_status.player.infos.playing_track.num);
	sendUdpMessage('infos/playing_track/current_time/set:' + lts_status.player.infos.playing_track.current_time);
	sendUdpMessage('infos/playing_track/total_time/set:' + lts_status.player.infos.playing_track.total_time);
	
	sendUdpMessage('sliders/track/set:' + lts_status.player.progress_percent);
	
	lts_status.ear_monitoring.level_percent = config.click.gain;
	lts_status.samples_mix.level_percent = config.samples.gain;
	
	sendUdpMessage('knobs/ear_monitoring/set:' + lts_status.ear_monitoring.level_percent);
	sendUdpMessage('knobs/samples_mix/set:' + lts_status.samples_mix.level_percent);
};

infobeamer_node.updateCallback = function(monitoring) {
	if (config.debug)
		console.log('Info-Beamer is running since ' + this.monitoring.uptime + ' at ' + this.monitoring.fps + ' FPS, CPU Usage : ' + this.monitoring.cpu + ', Memory Usage : ' + this.monitoring.mem + ', Temperature : ' + this.monitoring.temperature);
};

infobeamer_node.errorCallback = function(err) {
	console.log('Info-Beamer error');
};

function sendUdpMessage(message)
{
	if (config.debug && config.debug_udp)
		console.log('send UDP message : ' + 'info-beamer-ui-node/' + message);
	
	udp_client.send('info-beamer-ui-node/' + message, 4444, 'localhost', function(err) {
		//console.log(err)
	});
}

/**
 * Initialize process keyboard interface interactions
 */
function processKeyboardInit()
{
	if (config.debug)
		console.log('Initializing process keyboard interactions...');
	
	readline.emitKeypressEvents(process.stdin);
	process.stdin.setRawMode(true);

	process.stdin.on('keypress', (str, key) => {
		if( key == undefined )
		{
			if (config.debug)
				console.log('{'+char+'}')
		}
		else
		{
			if (config.debug)
				console.log('['+key.name+']');
			
			switch (key.name)
			{
				case 'left' :
					trackNavigationPrevious();
					break;

				case 'right' :
					trackNavigationNext();
					break;
					
				case 's' :
					trackPlayingStop();
					break;
					
				case 'space' :
					trackNavigationSelect();
					break;
				
				case 'a' :
					lts_status.player.progress_percent -= 1;
					if (lts_status.player.progress_percent < 0)
						lts_status.player.progress_percent = 0;
					
					lts_status.player.infos.playing_track.current_time = _secondsToMMSS(Math.round(97 / 100 * lts_status.player.progress_percent)); // 1500s = 25 minutes
					
					sendUdpMessage('sliders/track/set:' + lts_status.player.progress_percent);
					sendUdpMessage('infos/playing_track/current_time/set:' + lts_status.player.infos.playing_track.current_time);
					break;

				case 'z' :
					lts_status.player.progress_percent += 1;
					if (lts_status.player.progress_percent > 100)
						lts_status.player.progress_percent = 100;
					
					lts_status.player.infos.playing_track.current_time = _secondsToMMSS(Math.round(97 / 100 * lts_status.player.progress_percent)); // 1500s = 25 minutes
					
					sendUdpMessage('sliders/track/set:' + lts_status.player.progress_percent);
					sendUdpMessage('infos/playing_track/current_time/set:' + lts_status.player.infos.playing_track.current_time);
					break;
					
				case 'w' :
					lts_status.ear_monitoring.level_percent -= 1;
					if (lts_status.ear_monitoring.level_percent < 0)
						lts_status.ear_monitoring.level_percent = 0;
					
					config.click.gain = lts_status.ear_monitoring.level_percent;					
					try {
					track_click_player.gain(config.click.gain);
					} catch (e) {}
					sendUdpMessage('knobs/ear_monitoring/set:' + lts_status.ear_monitoring.level_percent);
					break;

				case 'x' :
					lts_status.ear_monitoring.level_percent += 1;
					if (lts_status.ear_monitoring.level_percent > 100)
						lts_status.ear_monitoring.level_percent = 100;
					
					config.click.gain = lts_status.ear_monitoring.level_percent;
					
					try
					{
						track_click_player.gain(config.click.gain);
					} catch (e) {}
					sendUdpMessage('knobs/ear_monitoring/set:' + lts_status.ear_monitoring.level_percent);
					break;
					
				case 'c' :
					lts_status.samples_mix.level_percent -= 1;
					if (lts_status.samples_mix.level_percent < 0)
						lts_status.samples_mix.level_percent = 0;
					
					config.click.gain = lts_status.samples_mix.level_percent;
					try
					{
						track_click_player.gain(config.click.gain);
					} catch (e) {}					
					sendUdpMessage('knobs/samples_mix/set:' + lts_status.samples_mix.level_percent);
					break;

				case 'v' :
					lts_status.samples_mix.level_percent += 1;
					if (lts_status.samples_mix.level_percent > 100)
						lts_status.samples_mix.level_percent = 100;
					
					config.click.gain = lts_status.samples_mix.level_percent;
					try
					{
						track_click_player.gain(config.click.gain);
					} catch (e) {}
					sendUdpMessage('knobs/samples_mix/set:' + lts_status.samples_mix.level_percent);
					break;
					
				case 'escape' :
					stopPlayingTrack();
					
					if (config.debug)
						console.log('Closing UDP client...');
					
					udp_client.close();
					
					if (config.debug)
						console.log('Closing Info-Beamer...');
					
					infobeamer_node.close();
					
					if (config.debug)
						console.log('Closing Touchscreen...');
					
					try {
						touchscreen_input.close();
					} catch (e) {}
					
					touchscreen_input = undefined;
					
					if (config.debug)
						console.log('Closing Arduino...');
					
					try {
						arduino_port.close();
					} catch (e) {}
					
					if (config.debug)
						console.log('Exiting process...');
					
					process.exit();
					break;
			}
		}
	})
	
	console.log('Press "escape" to exit process');
}

// Load configuration.json file
loadConfiguration();

// Check if all USB devices are connected
//checkUsb();

// Scan tracks directories & read informations
scanTracksDir();

// Info-Beamer init
infobeamer_node.run();

// Arduino input handler
processArduinoInit();

// Touchscreen input handler
processTouchScreenInit();

// LCD init & intro
//renderingIntro();

// Init tracks navigation
trackNavigationInit();

// Init Gamepad
processGamepadInit();

// Set MIDI inputs binding
processMIDInit();

// Set linux ssh keyboard binding
processKeyboardInit();