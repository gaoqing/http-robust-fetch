const {robustHttpFetch, oneoffFetch} = require("../index");

// const logger = console.log;
const logger = jest.fn();
const testUrl = 'http://localhost.test.com';

describe('retry failed fetch', () => {
    it('should resolve with successful response of first request if it succeed before timeout', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("great 1"), 50)))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("great 2"), 100)));

        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 200, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        await result.then(r => {
            expect(r).toBe('great 1');
            expect(mockTestOnlyFetch).toBeCalledTimes(1);
            done();
        })
    });

    it('should resolve with response of second request even it is late resolved when first request negatively responded', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => new Promise((resolve, reject) => setTimeout(() => reject("bad"), 50)))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("great"), 200)));

        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 100, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        // jest.advanceTimersByTime(500);
        await result.then(r => {
            expect(r).toBe('great');
            expect(mockTestOnlyFetch).toBeCalledTimes(2);
            done();
        })
    });

    it('result is the second rejected promise(as maxRequests set 2) when first request and redo-requests are all rejected', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => Promise.reject("bad 1"))
            .mockImplementationOnce(() => Promise.reject("bad 2"));

        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 100, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        await Promise.resolve();
        await result.catch(reason => {
            expect(reason).toBe('bad 2');
            expect(mockTestOnlyFetch).toBeCalledTimes(2);
            done();
        })
    });

    it('result is the second rejected promise when first and second negatively responded, because maxRequests set to 2, it will not fire the third request', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => Promise.reject("bad 1"))
            .mockImplementationOnce(() => Promise.reject("bad 2"))
            .mockImplementationOnce(() => Promise.reject("good 3"));

        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 100, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        await result.catch(reason => {
            expect(reason).toBe('bad 2');
            expect(mockTestOnlyFetch).toBeCalledTimes(2);
            done();
        })
    });
});

describe("redo delayed fetch", () => {
    it('should resolve with the earliest successful response when both are delayed after a defined timeout period, here first request resolve earlier', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("good 1"), 300)))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("good 2"), 200)));
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 200, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        await result.then(r => {
            expect(r).toBe('good 1');
            expect(mockTestOnlyFetch).toBeCalledTimes(2);
            done()
        })
    });

    it('should resolve with the earliest successful response when both are delayed after a defined timeout period, here second request resolve earlier', async done => {
        const mockTestOnlyFetch = jest.fn()
            .mockImplementation(() => Promise.reject("default-reject"))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("good 1"), 500)))
            .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve("good 2"), 100)));
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 200, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });

        await result.then(r => {
            expect(r).toBe('good 2');
            expect(mockTestOnlyFetch).toBeCalledTimes(2);
            done()
        })
    });
});

describe('usage hints', () => {
    it('1st argument "url", should be an URL string-represented value', async done => {
        const result = new Promise(resolve => {
            robustHttpFetch('not a url string', {timeout: 200, maxRequests: 2}, jest.fn(), logger);
        });

        await result.catch(e => {
            expect(e.message).toContain('url need to be provided as correct URL string value as web target for this request');
            done();
        });
    });

    it('2rd argument object "init" should contain "timeout" and "maxRequests" property as positive integer number', async done => {
        const result1 = new Promise(resolve => {
            robustHttpFetch(testUrl, 'not object', resolve, logger);
        });
        const result2 = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: -1, maxRequests: -1, mockTestOnlyFetch: jest.fn()}, resolve, logger);
        });

        await result1.catch(e => {
            expect(e.message).toContain('init parameter need to be provided as an object, at least give timeout and maxRequests properties');
            result1.passed = true;
        });

        await result2.catch(e => {
            expect(e.message).toContain('In init parameter, timeout property value need to be provided as a positive integer number');
            expect(e.message).toContain('In init parameter, maxRequests property value need to be provided as a positive integer number');
            result2.passed = true;
        });

        if (result1.passed && result2.passed) {
            done();
        }
    });

    it('init.maxRequests is the maximum number of requests to fire in case of response delayed or rejected', async done => {
        const mockTestOnlyFetch = jest.fn().mockReturnValue(Promise.reject("always rejected"));
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 10, maxRequests: 5, mockTestOnlyFetch}, resolve, logger);
        });

        await result.catch(e => {
            expect(mockTestOnlyFetch).toBeCalledTimes(5);
            done();
        })
    });

    it('3rd argument "callback", should be function', async done => {
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {
                timeout: 10,
                maxRequests: 5,
                mockTestOnlyFetch: jest.fn()
            }, 'not a function', logger);
        });

        await result.catch(e => {
            expect(e.message).toContain('callback need to be provided as a function');
            done();
        })
    });

    it('when fetch request return a value, then "callback" function will be called with a promise that will resolve with that value', async done => {
        const mockTestOnlyFetch = jest.fn().mockReturnValue("value that mockTestOnlyFetch call normally return");
        const callback = jest.fn();
        robustHttpFetch(testUrl, {timeout: 200, maxRequests: 2, mockTestOnlyFetch}, callback);
        await Promise.resolve();
        const callbackResult = callback.mock.calls[0][0];
        expect(callbackResult instanceof Promise).toBeTruthy();
        await callbackResult.then(r => {
            expect(r).toBe("value that mockTestOnlyFetch call normally return");
            done();
        })
    });

    it('when fetch request return a promise, then "callback" function will be called with a promise that will continue to resolve with it final resolution', async done => {
        const mockTestOnlyFetch = jest.fn().mockReturnValue(Promise.resolve(Promise.resolve("final resolution")));
        const callback = jest.fn();
        robustHttpFetch(testUrl, {timeout: 10, maxRequests: 5, mockTestOnlyFetch}, callback);
        await Promise.resolve();
        const callbackResult = callback.mock.calls[0][0];
        expect(callbackResult instanceof Promise).toBeTruthy();
        await callbackResult.then(r => {
            expect(r).toBe("final resolution");
            done();
        })
    });

    it('when fetch request throw an error, then "callback" function will be called with a promise will be rejected with that error message', async done => {
        const mockTestOnlyFetch = () => {
            throw new Error("always hit error");
        };
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {timeout: 100, maxRequests: 2, mockTestOnlyFetch}, resolve, logger);
        });
        await result.catch(e => {
            expect(e).toBe('always hit error');
            done();
        })
    })
});


describe('delegate fetch to either window.fetch or fetch from "node-fetch"', () => {
    it('should delegate to window.fetch when exist one', () => {
        const fetchMock = jest.fn();
        global.window.fetch = fetchMock;
        const hitNetworkFn = oneoffFetch(testUrl, {});
        expect(typeof hitNetworkFn).toBe('function');
        hitNetworkFn();
        expect(fetchMock).toHaveBeenCalled();
    });

    it('should delegate to node-fetch when not exist window.fetch', done => {
        global.window.fetch = null;
        jest.mock('node-fetch', () => (() => {
            global.funCalled = true;
        }));
        const hitNetworkFn = oneoffFetch(testUrl, {});
        expect(typeof hitNetworkFn).toBe('function');
        hitNetworkFn();
        if(global.funCalled){
            done();
        }
    });
});

