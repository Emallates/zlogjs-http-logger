'use strict';
module.exports = local;

var debug = require('debug')
  , onHeaders = require('on-headers')
  , onFinished = require('on-finished')
  , _ = require('../utils')
  , fs = require('fs')
  ;

function local(opts){
  return function logger(req, res, data, next){
    console.log('middleware called from zlogjs-http-logger!');
    var pre_write = res.write,
        pre_end = res.end;
    var body = data;
    var immediate = opts.immediate;
    var skip = opts.configs.SKIP || false;
    var skipCode = opts.configs.SKIP_CODE || false;
    recordStartTime.call(req);
    if(immediate) { logRequest(); }
    res.on('finish', function(){
       logRequest();
       function logRequest(){
         res.body = data;
         req.headers['X-Response-Time'] = new Date - req._startTime;
          if(skipCode){
            if(_.compair(parseInt(res.statusCode), skipCode));
            return next();
          }
          if(skip){
            if(_.isFunction(skip) && skip(req, res)) return next();
            var path = req.url;
            //here 
            if(skip[path]){
              var sObj = skip[path];
              if(_.isBoolean(sObj) && sObj) return next();
              if(_.isObject(sObj)){
                var _rslt = [], opr = (sObj.OPR||'').toUpperCase() || 'OR'; 
                if( sObj.CODE ) _rslt.push( _.compair(parseInt(res.statusCode), sObj.CODE) );
                if( sObj.METHOD ){ _rslt.push( _.compair(req.method, sObj.METHOD) );}          
                if(opr == 'OR' && _.OR(_rslt, true)) return next();
                else if(_.AND(_rslt, false)) return next();
              }
              if(_.isInt(sObj)) { if(_.compair(parseInt(res.statusCode), sObj)) return next();  }          
            }
          }
          if(opts.debug){
            console.log('log: ', path, res.statusCode, req.params, req.query);
            // return;
          }
         _log(req, res);
       }
    });
      next();
  }

}

function _log(req, res){
   var msg = _extract({req: req, res: res});
   var logStream = fs.createWriteStream('zlogjs.log', {'flags': 'a'});
   logStream.write(msg);
   logStream.end('.');
}

function _extract(obj){
   var strMsg = '\n';
   strMsg += xforwardip(obj.req) || getip(obj.req);
   strMsg += '--'+'['+new Date().toISOString()+']--';
   strMsg += obj.req.method;
   strMsg += obj.req.url;
   strMsg += _.len(obj.req.params) > 0 ? '/' : '';
   for(key in obj.req.params) {  strMsg += obj.req.params[key]; break; } 
   strMsg += _.len(obj.req.query) > 0 ? '?' : '';
   for(var key in obj.req.query){
    strMsg += strMsg[strMsg.length -1] == '?' ? key+'='+obj.req.query[key] : '&'+key+'='+obj.req.query[key];
   }
   strMsg += ' - HOST - '+obj.req.headers['host'];
   strMsg += ' - BROWSER - '+obj.req.headers['user-agent'];
   strMsg += ' - ENCODING - '+obj.req.headers['accept-encoding'];
   strMsg += ' - LANGUAGE - '+obj.req.headers['accept-language'];
   if(_.len(obj.req.body) > 0) strMsg += ' -body- ';
   for(var key in obj.req.body) { strMsg += key+'='+obj.req.body[key]+','; }
   strMsg += ' -CODE- '+obj.res.statusCode;
   strMsg += ' -X-Response-Time- '+obj.req.headers['X-Response-Time'];
   console.log('[LOG][STR] '+strMsg,'\n');
   return strMsg;
}

function getBody(res, data){
  if(typeof data[0] == 'string') return data[0].split(' ')[0] != 'Cannot' ? Buffer.concat(data).toString('utf8') : 404;
  if(typeof data[0] != 'string') return Buffer.concat(data).toString('utf8');
}

function getip(req) {
  return req.ip
    || req._remoteAddress
    || (req.connection && req.connection.remoteAddress)
    || undefined;
}

function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}

function xforwardip(req){
    
    var ipAddress;
    var forwardedIpsStr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (forwardedIpsStr) {
      var forwardedIps = forwardedIpsStr.split(',');
      ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
      ipAddress = req.connection.remoteAddress;
    }
    return ipAddress;
}

function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}
