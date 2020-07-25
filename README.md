<h1 align="center">Robust Http Fetch</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/robust-http-fetch">
    <img src="https://img.shields.io/npm/v/robust-http-fetch" />
  </a>
   <a href="https://github.com/gaoqing/robust-http-fetch/blob/master/LICENSE">
        <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow.svg" target="_blank" />
    </a>
  <a href="https://travis-ci.org/github/gaoqing/robust-http-fetch">
     <img src="https://travis-ci.org/gaoqing/robust-http-fetch.svg?branch=master" />
  </a>
  <a href="https://codecov.io/gh/gaoqing/robust-http-fetch">
    <img src="https://codecov.io/gh/gaoqing/robust-http-fetch/branch/master/graph/badge.svg" />
  </a>
  
</p>

## Robust Http Fetch

This `robust-http-fetch` is a light-weight and [100%-test-coverage](https://codecov.io/gh/gaoqing/robust-http-fetch) javascript utils helping to make robust http fetch request.

The underlying fetch will be delegated either to [window.fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) when use in browser or [node-fetch](https://www.npmjs.com/package/node-fetch) when use in node server.

It makes request to the provided url, if response is not received in timely manner(`init.timeout` config below) or failed (fragile network etc), it will fire another request to race(up to `init.maxRequests` requests to fire if none of them are well resolved). 

Request waits upto `init.timeout` milliseconds for response before sending a retry, if more than one request are still in-flight, then they are racing, the earliest good response will be resolved with and returned. Details refer to usage section in this page.

***Caveats***: only use this utils when your request is [idempotent](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent), for example GET, no matter how many times calling GET, should have same result and data integrity still maintained,
likewise for DELETE. In case of POST/PUT, make sure your server side to maintain the data integrity, for example backend to perform checking if previous requests have completed then abort duplicated requests etc.

see also in a github page: https://gaoqing.github.io/robust-http-fetch/
## Installation

Use the package manager [NPM](https://www.npmjs.com/package/robust-http-fetch) to install robust-http-fetch.

```bash
npm install robust-http-fetch
```

## Usage

Usage is as simple as below, can also refer to tests in [end2end tests](https://github.com/gaoqing/robust-http-fetch/blob/master/test/e2e.test.js) or [unit tests](https://github.com/gaoqing/robust-http-fetch/blob/master/test/index.test.js))

```javascript
 const robustHttpFetch = require('robust-http-fetch'); 

 const url = "https://postman-echo.com/post";
 const body = {hello: 'world'};

 /**
 * below input arguments for demonstration only. It use the Promise resolve callback function as the callback to the 3rd parameter, 
 * but you can use your custom callback function which accept a Promise object as its argument.
 * @input url, required, the resource destination
 * @input {timeout}, required, here request will wait 3000ms before firing retry request
 * @input {maxRequests}, required, here upto 3 requests to fire in case previous requests delayed or not well resolved
 * @input {method/body/headers}...and more, on demand properties, usage refer to `window.fetch`(init config)/`node-fetch`(options config)
 * @input resolve, required, any callback function to be invoked with a Promise object later
 * @input console.log,  optional function, any function accept a string argument 
 **/    
const resultAsPromise = new Promise((resolve, reject) => {
     robustHttpFetch(
         url, 
         {
             timeout: 3000,
             maxRequests: 3, 
             method: 'POST',
             body: JSON.stringify(body),
             headers: {'Content-Type': 'application/json'}
         },
         resolve,
         console.log
    );
 });

//do your stuff with this promise as usual, for example
resultAsPromise
    .then(res => res.json())
    .then(data => console.log(data));
```

 Arguments: 
 
 ```const robustHttpFetch = require('robust-http-fetch')```, it is a javascript function to use, which accept 4 parameters as followings
 

| Parameter                 | Required       | Type | Description   |	
| :------------------------ |:-------------:|:-------------: | :-------------|
| url	       |	true           |string | The resource destination url to make this request to
| init          | true          |object     | 2 properties are MANDATORY: ***'timeout'*** to time-box a single request and ***'maxRequests'*** to limit the total number of requests to attempt. <br /><br />Besides it can have on-demand properties in ['init'](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) parameter of `window.fetch` or ['options'](https://www.npmjs.com/package/node-fetch#options) parameter of `node-fetch`. <br /> Please refer to link ['init'](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) of window.fetch or ['options'](https://www.npmjs.com/package/node-fetch#options) of node-fetch
| callback 	       |	true	    |function        | It will be invoked with a resolved promise(if a request is well finished before attempting all the retry requests) <br /> or with last request' result(a promise that might be eventually resolved or rejected)
| optLogger 	       |	false	    |function        |Optional, if any, will get called with a single string parameter to give small hints when making request


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://github.com/gaoqing/robust-http-fetch/blob/master/LICENSE)