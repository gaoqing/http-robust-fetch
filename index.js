/**
 @param url, string, resource destination url to make request to, the fetch request will be delegated either to window.fetch(when use in browser) or npm module node-fetch(when use in node server side).
 @param init, object, can have properties in 'init' parameter of window.fetch api(https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
 or in 'options' parameter of node-fetch library (https://www.npmjs.com/package/node-fetch#options)
 beside those init/options settings from window.fetch or node-fetch, it has two MANDATORY settings: 'init.timeout' to time-box a request and 'init.maxRequests' to limit the total number of requests to attempt
 @param callback, will be invoked with a resolved promise(if a request is well finished before attempting all the retry requests) or last request result(a promise that might be eventually resolved or rejected)
 @param optLogger, optional function, will be called with a single string parameter to give a hint when making request.
 */
function robustHttpFetch(
    url,
    init,
    callback,
    optLogger
) {
    checkArgs(...arguments);
    const logger = getLogger(optLogger);
    const {timeout, maxRequests} = init;
    const oneoffFetchFn = oneoffFetch(url, init);

    // container holding scheduled timer, entry is a 2-values array, 1st is SN(SeqNumber) of scheduled request, 2nd is timer ID;
    const queuedTimers = [];

    const oneoffFetchFnWrapper = () => {
        try {
            const promise = oneoffFetchFn();
            return Promise.resolve(promise);
        } catch (e) {
            return Promise.reject(e.message);
        }
    };

    const doFetch = (cb, sn, startTime) => {
        logger(`#${sn} request about to fire`);
        const promise = oneoffFetchFnWrapper();
        cb(promise, sn, startTime);
    };

    const invokeCallback = (promise, sn, startTime) => {
        callback(promise
            .then((result) => {
                const duration = Date.now() - startTime;
                logger(
                    `#${sn} request well completed! duration = ${duration}ms`
                );
                queuedTimers.forEach((timerEntry) =>
                    clearTimeout(timerEntry[1])
                );
                queuedTimers.length = 0;
                return result;
            })
            .catch((e) => {
                return Promise.reject(e);
            }));
    };

    const scheduleFetch = (scheduleSN, delay) => {
        const action = () => {
            doFetch(
                (promise, sn, startTime) =>
                    promise
                        .then(() => invokeCallback(promise, sn, startTime))
                        .catch((error) => {
                            logger(`#${sn} request failed, error message: ${error}`);
                            if (sn === maxRequests - 1) {
                                invokeCallback(promise, sn, startTime);
                            } else if (Date.now() - startTime + 10 < timeout) {
                                const queueHead = queuedTimers.shift();
                                clearTimeout(queueHead[1]);
                                const queueHeadSn = queueHead[0];
                                scheduleFetch(queueHeadSn, 0);
                            }
                        }),
                scheduleSN,
                Date.now()
            );

            const nextSN = scheduleSN + 1;
            if (nextSN < maxRequests) {
                scheduleFetch(nextSN, timeout);
            }
        };

        if (delay <= 0) {
            action();
        } else {
            const timer = setTimeout(() => {
                logger(timeoutMessage(scheduleSN - 1, timeout));
                queuedTimers.shift();
                action();
            }, delay);
            queuedTimers.push([scheduleSN, timer]);
        }
    };

    scheduleFetch(0, 0);
}

function checkArgs(...args) {
    const argsCheckedInfo = [];

    try {
        new URL(args[0]);
    } catch (e) {
        argsCheckedInfo.push(`url need to be provided as correct URL string value as web target for this request`);
    }

    if (typeof args[1] !== 'object') {
        argsCheckedInfo.push(`init parameter need to be provided as an object, at least give timeout and maxRequests properties`);
    } else {
        const {timeout, maxRequests} = args[1];
        if (typeof timeout !== 'number' || timeout < 0) {
            argsCheckedInfo.push(
                'In init parameter, timeout property value need to be provided as a positive integer number as a delayed time(in millisecond) before firing another request'
            );
        }
        if (!Number.isInteger(maxRequests) || maxRequests < 0) {
            argsCheckedInfo.push(
                'In init parameter, maxRequests property value need to be provided as a positive integer number as total number of requests to attempt'
            );
        }
    }

    if (typeof args[2] !== 'function') {
        argsCheckedInfo.push(
            `callback need to be provided as a function, will get invoked with a promise as result, either resolved promise or last attempt result(last attempt might be resolved or rejected)`
        );
    }

    if (argsCheckedInfo.length > 0) {
        throw new Error(argsCheckedInfo.join(";\n").toString());
    }
}

function timeoutMessage(seqNum, timeout) {
    return `Request#${seqNum} no response in ${timeout}ms, fire another request`;
}

function getLogger(optLogger) {
    const logger = typeof optLogger === 'function' ? optLogger : (ignored) => {
    };
    return (args) => logger(new Date().toISOString() + ': ' + args);
}

function oneoffFetch(url, init) {
    const {mockTestOnlyFetch} = init;
    if (mockTestOnlyFetch) {
        return mockTestOnlyFetch;
    }

    const isBrowser = new Function("try {return window && this===window;}catch(e){ return false;}");
    const fetcher = (isBrowser() && window.fetch) || require('node-fetch');

    return () => fetcher(url, init);
}

module.exports = exports = {robustHttpFetch, oneoffFetch};










