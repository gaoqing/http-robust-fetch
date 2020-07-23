const robustHttpFetch = require("../index");

describe('e2e tests', () => {
    beforeEach(()=>jest.setTimeout(15 * 1000));

    it('GET request, give smaller timeout number so response might timeout then it will make retry', async done => {
        const testUrl = "https://postman-echo.com/get?foo1=bar1&foo2=bar2";
        const result = new Promise(resolve => {
            robustHttpFetch(testUrl, {method: 'GET', timeout: 3000, maxRequests: 5}, resolve, console.log);
        });

        await result.then(res => {
            res.json().then(json => console.log('YOUR-QUERY-DATA: ' + JSON.stringify(json.args) + '\n')).then(done);
        })
    });

    it('POST request, give smaller timeout number so response might timeout then it will make retry', async done => {
        const testUrl = "https://postman-echo.com/post";
        const body = {hello: 'world'};
        const result = new Promise(resolve => {
            robustHttpFetch(
                testUrl,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {'Content-Type': 'application/json'},
                    timeout: 3000, maxRequests: 5
                },
                resolve,
                console.log);
        });

        await result.then(res => {
            res.json().then(json => console.log('YOUR-POST-DATA: ' + JSON.stringify(json.data) + '\n')).then(done);
        })
    })
});