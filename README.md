<h1 align="center">Robust Http Fetch</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/robust-http-fetch">
  <img src="https://img.shields.io/badge/npm-v1.0.1-blue" />
  </a>
  <a href="https://github.com/gaoqing/robust-http-fetch/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg" target="_blank" />
  </a>
<a href="https://codecov.io/gh/gaoqing/robust-http-fetch">
  <img src="https://codecov.io/gh/gaoqing/robust-http-fetch/branch/master/graph/badge.svg" />
</a>
</p>

## Robust Http Fetch

This robust-http-fetch is a light-weight and [100%-test-coverage](https://codecov.io/gh/gaoqing/robust-http-fetch) javascript util for robustly making http fetch request.

The underlying fetch will be delegated to either [window.fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) when use in browser or [node-fetch](https://www.npmjs.com/package/node-fetch) when use in node server side.

It makes request to url endpoint, if response is not arrived in timely manner('init.timeout' settings below) or failed (fragile network etc), it will fire another same request as backup(up to 'init.maxRequests' requests to fire if none of them are happily resolved). It waits upto 'init.timeout' millisecond for response, if more than one requests are in-flight, the earliest resolved one will be resolved with and returned. Details refer to usage section in this page

***Caveat***: only use this utils when your request is [idempotent](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent), for example GET, no matter how many times calling GET, should have same result and data integrity still maintained.
as well as DELETE. In case of POST/PUT, make sure your server side(or rely on DB constraints etc) to maintain the integrity, for example backend to perform checking if previous requests have completed then abort duplicated requests etc.

## Installation

Use the package manager [npm](https://www.npmjs.com/package/robust-http-fetch) to install robust-http-fetch.

```bash
npm install robust-http-fetch
```

## Usage

Usage is as simple as below, can also refer to tests in [End2End tests](https://github.com/gaoqing/robust-http-fetch/blob/master/test/e2e.test.js) or [unit tests](https://github.com/gaoqing/robust-http-fetch/blob/master/test/index.test.js))

```javascript
 const { robustHttpFetch } = require('robust-http-fetch'); 

 const apiUrl = "https://postman-echo.com/post";
 const body = {hello: 'world'};

 //Here use the Promise resolve callback function as the callback in 3rd parameter, but you can use any function as callback to fit yourself
 const resultAsPromise = new Promise((resolve, reject) => {
     robustHttpFetch(
         apiUrl, // required, request url
         {
             timeout: 3000, // required, ie. here request will wait 1500ms before firing another request
             maxRequests: 3, // required, ie. here upto 3 requests to fire in case previous requests delayed or not resolved happily
             method: 'POST',
             body: JSON.stringify(body),
             headers: {'Content-Type': 'application/json'}
         },
         resolve, // required, callback function to be invoked with a Promise object later
         console.log // optional function
    );
 });

//Do your stuff with this promise as usual, for example
resultAsPromise
    .then(res => res.json())
    .then(data => console.log(data));
```

 Arguments: 
 
 ```const {robustHttpFetch} = require('robust-http-fetch')``` is a javascript function to use, which accept 4 parameters as following
 

| Parameter                 | Required       | Type | Description   |	
| :------------------------ |:-------------:|:-------------: | :-------------|
| url	       |	true           |string | the resource destination url to make this request to
| init          | true          |object     | it can have properties in ['init'](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) parameter of window.fetch or ['options'](https://www.npmjs.com/package/node-fetch#options) parameter of node-fetch. However two settings are MANDATORY: ***'timeout'*** to time-box a request and ***'maxRequests'*** to limit the total number of requests to attempt.<br /> other properties refer to ['init'](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) of window.fetch or ['options'](https://www.npmjs.com/package/node-fetch#options) of node-fetch
| callback 	       |	true	    |function        | it will be invoked with a resolved promise(if a request is well finished before attempting all the retry requests) or last request' result(a promise that might be eventually resolved or rejected)
| optLogger 	       |	false	    |function        |optional, if any, will get called with a single string parameter to give small hints when making request


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://github.com/gaoqing/robust-http-fetch/blob/master/LICENSE)