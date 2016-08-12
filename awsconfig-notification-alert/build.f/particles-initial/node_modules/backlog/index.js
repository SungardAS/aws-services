var fs = require('fs');
var sys = require("sys");
var async = require('async');
var dateFormat = require('dateformat');
var beautify = require('js-beautify').js_beautify;
var lzma = require("lzma").LZMA();

var backup, excluded;
var file_name = 'back.log'
var result = null;

var data = {
	filename: null,
	timestamp: null,
	message: null,
	char_count: null,
	line_count: null,
	encoded: null
};

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(36);
    }
    return hex;
};

function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 36);
        if (v) str += String.fromCharCode(v);
    }
    return str;
};

backlog = {
	settings : function(settingsList) {
		if (typeof settingsList.message != 'undefined')
			message = settingsList.message;
		else
			delete data['message'];

		if (typeof settingsList.logFile != 'undefined')
			file_name = settingsList.logFile;

		if (settingsList.backup == true)
			backup = true;
		else if (settingsList.backup == false)
			backup = false;
		else 
			backup = null;

		if (typeof settingsList.exclude != 'undefined') {
			if (Object.prototype.toString.call(settingsList.exclude) === '[object Array]')
				excluded = settingsList.exclude;
			else 
				excluded = null;
	  } 
	},

	clearLog : function(logName) {
		fs.readFile(logName, 'utf8', function(err, fetched_data) {
			if (IsJsonString(fetched_data)) {
				fs.writeFile(logName, '{}' ,function(err){
					if (err) throw err;
				})	
			} else {
				console.log('Error: Cannot clear log; make sure the log is in JSON format.')
			}
		});
	},

	retrieve : function(id, file) {
		fs.readFile(file, 'utf8', function(err, fetched_data){
			if (IsJsonString(fetched_data)) {
				parsed_data = JSON.parse(fetched_data);

				if (typeof parsed_data[id.toString()] == 'undefined') {
					fs.writeFile(id.toString()+'_'+process.mainModule.filename.replace(/^.*[\\\/]/, ''), 'Please make sure the file instance you are trying to receive exists.', function(err){
						if (err) throw err;
					});

				} else {
					if (parsed_data[id.toString()].encoded) {
						lzma.decompress(parsed_data[id.toString()].encoded.split(','), function(result){
							fs.writeFile(id.toString()+'_'+process.mainModule.filename.replace(/^.*[\\\/]/, ''), beautify(result, { indent_size: 2 }), function(err){
								if (err) throw err;
							});
						});
					} else {
						fs.writeFile(id.toString()+'_'+process.mainModule.filename.replace(/^.*[\\\/]/, ''), "\"\"\"You cannot retrieve a file instance that was not backed up, use 'backup: true' \nas a setting in your backup.settings({}); to backup your file instance.\"\"\"", function(err){
							if (err) throw err;
						});
					}
				}
			} else {
				return null
			}
		});
	},
	init : function(){
		file = file_name || 'back.log';

		if (Object.prototype.toString.call(excluded) === '[object Array]') {
			for (i = 0; i<=excluded.length; i++) {
				if (data.hasOwnProperty(excluded[i])){
					delete data[excluded[i]];
				}
			} 
		}

		(function generateInfo(data, backup){
			var i;
			var chunk;
			var count = 0;
			fs.createReadStream(process.mainModule.filename)
		  .on('data', function(chunk) {
		    for (i=0; i < chunk.length; ++i)
		      if (chunk[i] == 10) count++;
		  })
		  .on('end', function() {
		  	var linecount = count;
		    fs.readFile(process.mainModule.filename, 'utf8', function (err, fetched_data) {
			  	if (err) throw err;
			  	var now = new Date();
		      ts = dateFormat(now);
			    charactercount = fetched_data.length;

			    data['filename'] = process.mainModule.filename;
			    data['timestamp'] = ts;
			    if (typeof message != 'undefined') data['message'] = message;
					data['char_count'] = charactercount;
					data['line_count'] = linecount;

					async.parallel([
					  function(callback) {
					    if (backup == true) {
						  	lzma.compress(fetched_data.replace(/\s+/g, ' '), 1, function(result){
									callback(null, result.join(','));
								});
								return;
						  } else {
						  	 result = null 
						  	 callback(null, result)
						  	 return;
						  }
					  }], function(err, result){
					    if (result[0] != null) {
								data['encoded'] = result.join(' ');
							} else {
								delete data['encoded'];								
							}

							if (fs.existsSync(file) != true){
								fs.writeFileSync(file, '');
							} 

					    fs.readFile(file, 'utf8', function (err, fetched_data) {
								if (err) throw err;

							  if (IsJsonString(fetched_data)) {
									parsed_data = JSON.parse(fetched_data);
									i = Object.size(parsed_data) + 1
									parsed_data[i] = data;
									final_data = parsed_data
								} else {
									fetched_data = {};
									fetched_data['1'] = data;
									final_data = fetched_data;
								}

						  	fs.writeFile(file, JSON.stringify(final_data, null, 2), function(err) {
							    if(err) {
							      console.log(err);
							    } else {
							      //console.log(file + " saved");
							      console.log(file_name+' running as backlog...')
							    }
								});
								
							});
					  });

			  });
		  });
		})(data, backup);
	}
	
};

module.exports = backlog;
