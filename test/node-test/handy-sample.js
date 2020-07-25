const robustHttpFetch = require('robust-http-fetch');

const testUrl = "https://postman-echo.com/post";
const body = {Hello: 'Thanks for your trying!'};

// NOTE: try adjusting the `timout` setting below to be a bit smaller number, occasionally you may see request timeout
// and then auto retry requests will be made for you
const result = new Promise(resolve => {
    robustHttpFetch(
        testUrl,
        {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'},
            timeout: 5000,
            maxRequests: 10
        },
        resolve,
        console.log);
});

async function execute() {
    await result.then(res => {
        res.json().then(json => console.log('\n' + 'YOUR-POST-DATA: ' + JSON.stringify(json.data) + '\n'));
    })
}

execute();