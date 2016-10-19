# zlogjs-http-logger
log http request, response, locally or on a remote server.

[![Join the chat at https://gitter.im/Emallates/zlogjs-http-logger](https://badges.gitter.im/Emallates/zlogjs-http-logger.svg)](https://gitter.im/Emallates/zlogjs-http-logger?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Version][version-svg]][package-url] [![Build Status][travis-svg]][travis-url] <br/>  [![ISSUES][issues-url]][issues-url] [![FORKS][forks-url]][forks-url] [![STARS][stars-url]][stars-url] ![Downloads][downloads-image] <br/>
[![License][license-image]][license-url]


[version-svg]: https://img.shields.io/npm/v/zlogjs-http-logger.svg?style=flat-square
[package-url]: https://npmjs.org/package/zlogjs-http-logger
[travis-svg]: https://img.shields.io/travis/Emallates/zlogjs-http-logger/master.svg?style=flat-square
[travis-url]: https://api.travis-ci.org/Emallates/zlogjs-http-logger.svg?branch=master
[issues-url]:https://img.shields.io/github/issues/Emallates/zlogjs-http-logger.svg?style=flat-square
[forks-url]:https://img.shields.io/github/forks/Emallates/zlogjs-http-logger.svg?style=flat-square
[stars-url]:https://img.shields.io/github/stars/Emallates/zlogjs-http-logger.svg?style=flat-square
[downloads-image]: https://img.shields.io/npm/dm/zlogjs-http-logger.svg?style=flat-square
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-url]: https://raw.githubusercontent.com/Emallates/zlogjs-http-logger/master/LICENSE

##DESCRIPTION
zlogjs-http-logger is a plugin for [zlogjs-adapter](https://github.com/Emallates/zlogjs-adapter) to log native http server requests and responses for nodejs applications.<br/>
log http request, response, locally or on a remote server.

<!--NO_HTML-->
Table of Contents
-----------------

1. [Installation](#installation)
1. [Configuration](#configuration)
1. [Log](#log)
	- [Global](#global)
	- [Specific](#specific)
1. [Issues and Suggestions](#issues-and-suggestions)
1. [License](#license)

<!--/NO_HTML-->

## Installation
```bash
npm install zlogjs-http-logger --save
```

## Configuration
As this logger is a plugin of [zlogjs-adapter](https://github.com/Emallates/zlogjs-adapter), you need to install [that](https://github.com/Emallates/zlogjs-adapter) first.
To log locally just put the value of mode `local` otherwise `remote`.
```javascript
var config = {
	collections:{
		adapter:{
			host:'host', port:'port',
			adapter:require('zlogjs-adapter'), plugin:'zlogjs-http-logger',
			appId:'appid', apiKey:'apikey',
			mode:'remote'
		}
	}
};
```

## Log
To start using this logger you need to construct it from [zlogjs-adapter](https://github.com/Emallates/zlogjs-adapter) and [enoa-client](https://github.com/Emallates/enoa-client).
Then you need to include it inside the http server of your application. Parameters request, response are the same objects you need to pass
and from these parameters false option will stay as it is if you are using this logger on exit point of every request. 
#### Global
```javascript
var logger = require('enoa-client')(config).adapter.logger;
http.createServer(function (req, res, next) {
	logger(req, res, res.body, false, CallbackFn);
});

```
#### Specific
```javascript
logger(req, res, res.body, true, CallbackFn);
```

## Issues and Suggestions
This is the first version of [zlogjs-http-logger](https://github.com/Emallates/zlogjs-http-logger), so we are looking forward to make this logger perfect. if there is any issue or you want to add new feature to the logger please feel free to raise it.

## License

**[MIT](./LICENSE)**
&copy; 2016 [Emallates](http://github.com/Emallates)
