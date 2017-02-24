gl.setup(1600, 960)

local debug_mode = false

local res = util.auto_loader()

local infos = {
	style = 1;
	tracks = {
		count = "00";
	};
	playing_track = {
		title = "";	
		num = "00";
		current_time = "00:00";
		total_time = "00:00"
	};
};

local function hslider(conf)
	local x = conf.x
	local y = conf.y
	local max_w = conf.max_w
	local h = conf.h
	local alpha = conf.alpha
	local bg_offset_x = conf.bg_offset_x
	local bg_offset_y = conf.bg_offset_y
	local bg_w = conf.bg_w
	local bg_h = conf.bg_h
	local value = conf.value
	local btn_offset_x = conf.btn_offset_x
	local btn_offset_y = conf.btn_offset_y
	local btn_x_range = conf.btn_x_range
	local btn_w = conf.btn_w
	local btn_h = conf.btn_h
	local btn_alpha = conf.btn_alpha
	
	-- cached computing for fastest rendering
	local cached = false
	local cached_progress_x2 = 0
	local cached_progress_y2 = 0
	local cached_btn_x = 0
	local cached_btn_y = 0
	local cached_btn_x2 = 0
	local cached_btn_y2 = 0
	
	local function set(new_value)
		value = new_value
				
		cached_progress_x2 = x + (value / 100) * max_w
		cached_progress_y2 = y + h
		cached_btn_x = x + (value / 100) * btn_x_range + btn_offset_x
		cached_btn_y = y + btn_offset_y
		cached_btn_x2 = x + (value / 100) * btn_x_range + btn_offset_x + btn_w
		cached_btn_y2 = y + btn_offset_y + btn_h
	end
	
	local function get()
		return value
	end
	
	local function draw()
		if (cached == false) then
			set(value)
			cached = true
		end
		
		res.slider_bg:draw(x + bg_offset_x, y + bg_offset_y, x + bg_offset_x + bg_w, y + bg_offset_y + bg_h)
		res.slider_progress:draw(x, y, cached_progress_x2, cached_progress_y2, alpha);
		res.slider_btn:draw(cached_btn_x, cached_btn_y, cached_btn_x2, cached_btn_y2, btn_alpha);
	end
	
	return {
		draw = draw;
		set = set;
		get = get;
	}
end

local circle = resource.create_shader[[
    varying vec2 TexCoord;
    uniform float r, g, b;
    uniform float width;
    uniform float progress;
    void main() {
        float e = 0.003;
        float angle = atan(TexCoord.x - 0.5, TexCoord.y - 0.5);
        float dist = distance(vec2(0.5, 0.5), TexCoord.xy);
        float inner = (1.0 - width) / 2.0;
        float alpha = (smoothstep(0.5, 0.5-e, dist) - smoothstep(inner+e, inner, dist)) * smoothstep(progress-0.01, progress, angle);
        gl_FragColor = vec4(r, g, b, alpha);
    }
]]

local dummy = resource.create_colored_texture(1,1,1,1)

local function knob(conf)
	local center_x = conf.center_x
	local center_y = conf.center_y
	local progress_w = conf.progress_w
	local progress_h = conf.progress_h
	local progress_alpha = conf.progress_alpha
	local bg_offset_x = conf.bg_offset_x
	local bg_offset_y = conf.bg_offset_y
	local bg_w = conf.bg_w
	local bg_h = conf.bg_h
	local btn_w = conf.btn_w
	local btn_h = conf.btn_h
	local btn_alpha = conf.btn_alpha
	local min_angle = conf.min_angle
	local max_angle = conf.max_angle
	local tooltip_color_r = conf.tooltip_color_r
	local tooltip_color_g = conf.tooltip_color_g
	local tooltip_color_b = conf.tooltip_color_b
	local value = conf.value
	
	-- cached computing for fastest rendering
	local cached = false
	local cached_rotation_angle = 0

	
	
	local function set(new_value)
		value = new_value
		
		cached_rotation_angle = ((value / 100) * (max_angle - min_angle)) + min_angle
		
		cached_btn_x = btn_w / 2
		cached_btn_y = btn_h
		cached_btn_x2 = -btn_w / 2
		cached_btn_y2 = 0
		
		cached_progress_x = - progress_w / 2
		cached_progress_y = - progress_w / 2
		cached_progress_x2 = progress_w / 2
		cached_progress_y2 = progress_h / 2
	end
	
	local function get()
		return value
	end
	
	local function getAngle()
		return cached_rotation_angle
	end
	
	local function draw()
		if (cached == false) then
			set(value)
			cached = true
		end
		
		res.knob_bg:draw(center_x + bg_offset_x, center_y + bg_offset_y, center_x + bg_offset_x + bg_w, center_y + bg_offset_y + bg_h)
		
		gl.pushMatrix()
		gl.translate(center_x, center_y)
		gl.rotate(cached_rotation_angle, 0, 0, 1)
		res.knob_btn:draw(cached_btn_x, cached_btn_y, cached_btn_x2, cached_btn_y2, btn_alpha);
		gl.popMatrix()
		
		gl.pushMatrix()
		gl.translate(center_x, center_y)
		gl.rotate(cached_rotation_angle + 180, 0, 0, 1)
        -- dummy:draw(cx-radius, cy-radius, cx+radius, cy+radius)       
		res.knob_progress:draw(cached_progress_x, cached_progress_y, cached_progress_x2, cached_progress_x2, progress_alpha);			
		gl.popMatrix()
		
		-- TODO : Progress arc shader
		--circle:use{
        --    1, 1, 1,
        --    width = 50,
        --    progress = -math.rad(cached_rotation_angle - 360),
        --}
		--dummy:draw(cached_progress_x + center_x, cached_progress_y + center_y, cached_progress_x2 + center_x, cached_progress_x2 + center_y, progress_alpha)
		--circle:deactivate()		
		
		local text_w = res.roboto_bold:width(value .. "%", 45)
		res.roboto_bold:write(center_x - text_w / 2, center_y + 193, value .. "%", 45, tooltip_color_r, tooltip_color_g, tooltip_color_g, 1)
	end
	
	return {
		draw = draw;
		set = set;
		get = get;
		getAngle = getAngle;
	}
end

local sliders = {
	track = hslider{
		x = 75,
		y = 387,
		max_w = 1458,
		h = 31,
		alpha = 1,
		bg_offset_x = 6,
		bg_offset_y = 10,
		bg_w = 1437,
		bg_h = 10,
		btn_offset_x = 0,
		btn_offset_y = -9,
		btn_x_range = 1405,
		btn_w = 46,
		btn_h = 47,
		btn_alpha = 1,
		value = 0		
	};
}

local knobs = {
	ear_monitoring = knob{
		center_x = 288,
		center_y = 664,
		progress_w = 335,
		progress_h = 335,
		progress_alpha = 1,
		bg_offset_x = -204,
		bg_offset_y = -204,
		bg_w = 408,
		bg_h = 465,
		btn_w = 50,
		btn_h = 230,
		min_angle = 34,
		max_angle = 326,
		btn_alpha = 1,
		-- 88888f RGB(136,136,143)
		tooltip_color_r = 0.53333333333333333333333333333333,
		tooltip_color_g = 0.53333333333333333333333333333333,
		tooltip_color_b = 0.56078431372549019607843137254902,
		value = 0
	},
	
	samples_mix = knob{
		center_x = 1312,
		center_y = 664,
		progress_w = 335,
		progress_h = 335,
		progress_alpha = 1,
		bg_offset_x = -204,
		bg_offset_y = -204,
		bg_w = 408,
		bg_h = 465,
		btn_w = 50,
		btn_h = 230,
		min_angle = 34,
		max_angle = 326,
		btn_alpha = 1,
		-- 88888f RGB(136,136,143)
		tooltip_color_r = 0.53333333333333333333333333333333,
		tooltip_color_g = 0.53333333333333333333333333333333,
		tooltip_color_b = 0.56078431372549019607843137254902,
		value = 0
	}
}

util.data_mapper{
	["infos/style/set"] = function(value)
		infos.style = tonumber(value)
    end;

	["infos/playing_track/title/set"] = function(value)
        infos.playing_track.title = value
    end;

	["infos/playing_track/num/set"] = function(value)
        infos.playing_track.num = value
    end;
	
	["infos/playing_track/current_time/set"] = function(value)
        infos.playing_track.current_time = value
    end;
	
	["infos/playing_track/total_time/set"] = function(value)
        infos.playing_track.total_time = value
    end;
	
	["infos/tracks/count/set"] = function(value)
        infos.tracks.count = value
    end;

	["sliders/track/set"] = function(value)
        sliders.track.set(tonumber(value))
    end;
	
	["knobs/ear_monitoring/set"] = function(value)
        knobs.ear_monitoring.set(tonumber(value))
    end;
	
	["knobs/samples_mix/set"] = function(value)
        knobs.samples_mix.set(tonumber(value))
    end;
}

local debug_info_line_y = 10
local function writeDebugInfo(line, bold)
	if (bold == true) then
		res.roboto_bold:write(10, debug_info_line_y, line, 40, 1, 1, 1, 1)
	else
		res.roboto:write(10, debug_info_line_y, line, 40, 1, 1, 1, 1)
	end
	debug_info_line_y = debug_info_line_y + 40
end

local function debugInfo()
	writeDebugInfo("DEBUG INFO", true)
	writeDebugInfo("Track progress : " .. sliders.track.get(), false)
	writeDebugInfo("Ear-monitoring level : " .. knobs.ear_monitoring.get(), false)
	writeDebugInfo("Ear-monitoring angle : " .. knobs.ear_monitoring.getAngle(), false)
end

local function drawInfos()
	local infos_bg = {
		x = 73;
		y = 185;
		w = 1451;
		h = 151;
	};
	
	local infos_bg2 = {
		x = 73;
		y = 205;
		w = 1451;
		h = 120;
	};
	
	local infos_playing_title = {
		x = 106;
		y = 205;
		font_size = 55;
		font_color = {
			-- 88888f rgb(136, 136, 143)
			r = 0.53333333333333333333333333333333;
			g = 0.53333333333333333333333333333333;
			b = 0.56078431372549019607843137254902;
		};
		value = infos.playing_track.title;
	}
	
	local infos_track_num = {
		x = 1195;
		y = 194;
		font_size = 65;
		font_color = {
			-- 618ac6 rgb(97, 138, 198)
			r = 0.38039215686274509803921568627451;
			g = 0.54117647058823529411764705882353;
			b = 0.77647058823529411764705882352941;
		};
		value = infos.playing_track.num;
	};

	local infos_track_count = {
		font_size = 65;
		font_color = {
			-- 88888f rgb(136, 136, 143)
			r = 0.53333333333333333333333333333333;
			g = 0.53333333333333333333333333333333;
			b = 0.56078431372549019607843137254902;
		};
		value = infos.tracks.count
	};
	
	local infos_track_current_time = {
		x = 1107;
		y = 258;
		font_size = 65;
		font_color = {
			-- 618ac6 rgb(97, 138, 198)
			r = 0.38039215686274509803921568627451;
			g = 0.54117647058823529411764705882353;
			b = 0.77647058823529411764705882352941;
		};
		value = infos.playing_track.current_time;
	};

	local infos_track_total_time = {
		font_size = 65;
		font_color = {
			-- 88888f rgb(136, 136, 143)
			r = 0.53333333333333333333333333333333;
			g = 0.53333333333333333333333333333333;
			b = 0.56078431372549019607843137254902;
		};
		value = infos.playing_track.total_time;
	};
	
	if (infos.style == 1) then
		-- background
		res.infos_bg:draw(infos_bg.x, infos_bg.y, infos_bg.x + infos_bg.w, infos_bg.y + infos_bg.h, 1)
		
		-- playing title
		res.roboto:write(infos_playing_title.x, infos_playing_title.y, infos_playing_title.value, infos_playing_title.font_size, infos_playing_title.font_color.r, infos_playing_title.font_color.g, infos_playing_title.font_color.b , 1) 
		
		-- track num
		res.digital_7:write(infos_track_num.x, infos_track_num.y, infos_track_num.value, infos_track_num.font_size, infos_track_num.font_color.r, infos_track_num.font_color.g, infos_track_num.font_color.b , 1)
		
		-- track count
		local temp_w = res.digital_7:width(infos_track_num.value, infos_track_num.font_size)
		res.digital_7:write(infos_track_num.x + temp_w, infos_track_num.y, ' / ' .. infos_track_count.value, infos_track_count.font_size, infos_track_count.font_color.r, infos_track_count.font_color.g, infos_track_count.font_color.b , 1) 
		
		-- track current time
		res.digital_7:write(infos_track_current_time.x, infos_track_current_time.y, infos_track_current_time.value, infos_track_current_time.font_size, infos_track_current_time.font_color.r, infos_track_current_time.font_color.g, infos_track_current_time.font_color.b , 1)
		
		-- track total time
		local temp_w = res.digital_7:width(infos_track_current_time.value, infos_track_current_time.font_size)
		res.digital_7:write(infos_track_current_time.x + temp_w, infos_track_current_time.y, ' / ' .. infos_track_total_time.value, infos_track_total_time.font_size, infos_track_total_time.font_color.r, infos_track_total_time.font_color.g, infos_track_total_time.font_color.b , 1) 
	elseif (infos.style == 2) then
		-- background
		res.infos_bg2:draw(infos_bg2.x, infos_bg2.y, infos_bg2.x + infos_bg2.w, infos_bg2.y + infos_bg2.h, 1)
		
		-- playing title
		res.roboto:write(infos_playing_title.x, infos_playing_title.y, infos_playing_title.value, infos_playing_title.font_size, infos_playing_title.font_color.r, infos_playing_title.font_color.g, infos_playing_title.font_color.b , 1) 
		
		-- track num
		res.digital_7:write(infos_track_num.x, infos_track_num.y, infos_track_num.value, infos_track_num.font_size, infos_track_num.font_color.r, infos_track_num.font_color.g, infos_track_num.font_color.b , 1)
		
		-- track count
		local temp_w = res.digital_7:width(infos_track_num.value, infos_track_num.font_size)
		res.digital_7:write(infos_track_num.x + temp_w, infos_track_num.y, ' / ' .. infos_track_count.value, infos_track_count.font_size, infos_track_count.font_color.r, infos_track_count.font_color.g, infos_track_count.font_color.b , 1) 
		
		-- track current time
		res.digital_7:write(infos_track_current_time.x, infos_track_current_time.y, infos_track_current_time.value, infos_track_current_time.font_size, infos_track_current_time.font_color.r, infos_track_current_time.font_color.g, infos_track_current_time.font_color.b , 1)
		
		-- track total time
		local temp_w = res.digital_7:width(infos_track_current_time.value, infos_track_current_time.font_size)
		res.digital_7:write(infos_track_current_time.x + temp_w, infos_track_current_time.y, ' / ' .. infos_track_total_time.value, infos_track_total_time.font_size, infos_track_total_time.font_color.r, infos_track_total_time.font_color.g, infos_track_total_time.font_color.b , 1) 
	end
end

function node.render()
	debug_info_line_y = 10
    gl.clear(0, 0, 0, 1)
    
	res.background:draw(0, 0, WIDTH, HEIGHT, 1)
		
	drawInfos();
	
	res.logo_ear_monitoring:draw(490, 709, 490 + 224, 709 + 213, 0.5)
	res.logo_samples_mix:draw(890, 717, 890 + 215, 717 + 207, 0.5)
	
	if (debug_mode == true) then
		debugInfo()
	end
	
	for _, slider in pairs(sliders) do
		slider.draw()
	end
	
	for _, knob in pairs(knobs) do
		knob.draw()
	end
end