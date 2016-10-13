'use strict';
module.exports = remote;

var debug = require('debug')
  , onHeaders = require('on-headers')
  , http = require('http')
  , url = require('url')
  , onFinished = require('on-finished')
  , conf = require('../../.conf')
  , enm = require('../enm')
  , _ = require('../utils')
  ;

function remote(creds, options/*, request*/){
  var base = {input:conf.BASE.input};
  var opts = options || {};
  var sURL = creds.host || creds.configs.host;
  if(!sURL) throw new Error('Define server url first');
  var skip = opts.SKIP || creds.configs.SKIP || false;
  var skipCode = opts.SKIP_CODE || creds.configs.SKIP_CODE || false;
  return function logger(req, res, data, next){
    var pre_write = res.write,
        pre_end = res.end;
     res.on('finish', function(){
       res.body = data;
       req._remoteAddress = getip(req);
       req._tags = getTags(req, creds.TAGS || creds.configs.TAGS);
       logRequest();
       function logRequest(){
        req.headers['X-Response-Time'] = new Date - req._start;
        if(skipCode){
          if(_.compair(parseInt(res.statusCode), skipCode))
          return next();
        }
        if(skip){
          if(_.isFunction(skip) && skip(req, res)) return next();
          var path = req.url;
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
          return;
        }
        _process({req:req, res:res, base: base}, creds, opts);
      }
    });
    next();
  }

}

function _process(obj, creds, options){
  req.query = !req.query ? getQuery(req) : req.query;
  var base = obj.base;
   var mbody = {};
   mbody.msg = {
     response:obj.res.statusCode == 304 ? undefined : _.isObject(obj.res.body) ? obj.res.body : _.isString(obj.res.body) ? obj.res.body : undefined,
     request:{
       body:{
         body:obj.req.body, 
         query:obj.req.query,
         params:obj.req.params
       }
       , ipxf:xforwardip(obj.req)
       , headers: obj.req.headers
       , ip:obj.req._remoteAddress
       , timestamp:new Date().toISOString()
       , tags:getTags(obj.req, options.TAGS || creds.configs.TAGS) 
       , route:(obj.req.route) ? obj.req.route : {path:obj.req.path}
       , originalUrl : obj.req.url
       , method: obj.req.method
     }
   };
   mbody.token = creds.configs.apiKey;
   mbody.app_id = creds.configs.appId;
   mbody.code = mbody.msg.mcode = parseInt(obj.res.statusCode);
   mbody = ext(obj, mbody);
   _sendRequest()({body:mbody, url:creds.configs.host+base.input, timeout:creds.configs.timeout, method:"POST"}, function(err,res, data){  /*console.log(err ? err: data ? data : 'empty'); */ });
}

function getQuery(req){
   return require('url').parse(req.url, true).query;
}

function ext(obj, mObj){
   for(var v in obj){ if(enm.CB_CRITERIA[v] === obj[v]) mObj[v] = enm.CB_CRITERIA[v].valid(obj[v]);   }
   for(var index in enm.EXEC_CRITERIA.CONFIGURED){  mObj[enm.EXEC_CRITERIA.CONFIGURED[index]] = true; }
   return mObj;
};

/**
 * Record the start time.
 * @private
 */

function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}

/**
 * Get request IP address.
 *
 * @private
 * @param {IncomingMessage} req
 * @return {string}
 */

function getip(req) {
  return req.ip
    || req._remoteAddress
    || (req.connection && req.connection.remoteAddress)
    || undefined;
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

function getTags(req, tags){
  tags = tags || {};
  return { splitter : tags.splitter || '>',tags: tags[req.url] } || {};
}

function getBody(res, data){
  // console.log(data);
  // place a strack trace function here later
  if(typeof data[0] == 'string') return data[0].split(' ')[0] != 'Cannot' && data[0].split(':')[0] != 'ReferenceError' && data[0].split(':')[0] != 'TypeError' ? (Buffer.concat(data).toString('utf8') || data) : 404;
  if(typeof data[0] != 'string') return Buffer.concat(data).toString('utf8');
}

function _sendRequest(){
  return function request(params, cb) {
    var http_params = { headers:{ 'Content-Type': 'application/json' } };
    var url_parts = url.parse(params.url);
    if(params.headers) for(var i in params.headers) http_params.headers[i] = params.headers[i];
    http_params.method = params.method || "GET";
    for(var i in {path:1, port:1, hostname:1, protocol:1}) if(url_parts[i] != undefined) http_params[i] = url_parts[i];
    if(['http:', 'https:'].indexOf(http_params.protocol) == -1)http_params.protocol = 'http:';
    var DATA = "";
    var req = http.request(http_params, function(res){
      res.setEncoding('utf8');
      res.on('data', function (body){ if(body) DATA+=body; });
      res.on('end', function (body){ if(body) DATA+=body; return cb(null, DATA); });
    });
    req.on('error', function(e) { return cb(e.message || e); });
    if(params.body) req.write(JSON.stringify(params.body));
    req.end();
  }
}