module.exports = function(opts){ opts = opts || {}; 
	return opts.request != undefined && opts.response != undefined ? require('./ext')(opts).log() : require('./ext')(opts).logger(); 
};