
async function checkMeta() {
    console.log("Checking JM Bullion Meta Tags...");
    const res = await fetch('https://www.jmbullion.com/gold-fear-greed-index/');
    const html = await res.text();
    const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    if (metaDesc) {
        console.log("Meta Description:", metaDesc[1]);
    } else {
        console.log("No meta description found.");
    }
}
checkMeta();
