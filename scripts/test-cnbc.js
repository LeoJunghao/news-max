
async function testCNBC() {
    const symbol = '.TWII';
    const url = `https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&exthrs=1&noform=1&fund=1&output=json&symbols=${symbol}`;

    try {
        const res = await fetch(url);
        const text = await res.text();
        const data = JSON.parse(text);

        console.log('CNBC Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testCNBC();
