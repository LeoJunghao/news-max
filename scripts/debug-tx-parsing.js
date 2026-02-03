const fs = require('fs');

// Mock HTML similar to Yahoo Finance TW Futures (inferred from screenshot and existing regex)
// Case: Negative change but percentage inside parens has no sign
const mockHtml = `
<div class="D(f) Ai(fe) Mb(4px)">
<span class="Fz(32px) Fw(b) Lh(1) C($c-trend-down)">32,105.00</span>
<span class="Fz(20px) Fw(b) Lh(1.2) C($c-trend-down) Mstart(12px) D(f) Ai(c)">
<span class="Mend(4px)">▼</span>179.00
</span>
<span class="Fz(20px) Fw(b) Lh(1.2) C($c-trend-down) Mstart(8px)">
(0.55%)
</span>
</div>
`;

// Copy-paste the logic from src/lib/stats.ts (simplified)
function parseTX(text) {
    const priceMatch = text.match(/class="Fz\(32px\)[^>]*>([0-9,]+\.?[0-9]*)<\/span>/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

    let changePercent = 0;
    let change = 0;

    if (priceMatch) {
        // Mocking context extraction
        const context = text;

        // 1. Change Amount
        const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>[\s\S]*?([0-9,]+\.?[0-9]*)<\/span>/);
        // Wait, the regex in stats.ts was: 
        // const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>/);

        // Let's refine the mock regex to match what's in the file exactly
        // file content: const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>/);

        // In my mock, the change part is: <span ...>▼</span>179.00\n</span> (This might not match strict regex if span is closed differently)
        // Actually, Yahoo often puts arrow in text or separate span.
        // Let's look at the screenshot: "▼ 179.00 (0.55%)"
        // Let's look at code in stats.ts:
        // const realChangeMatch = context.match(/>([▲▼])?([0-9,]+\.?[0-9]*)<\/span>/);

        // If my mock is: <span ...>▼</span>179.00
        // Then >▼<\/span> matches? No.

        // Let's use a simpler mock that hypothetically passes existing regex but fails logic
        // Case: Change part matched, Percent part matched.

        // Simulating the matches directly found by regex:

        let val = 179.00;
        let arrow = '▼';
        if (arrow === '▼') val = -val;
        change = val;

        // 2. Change Percent
        // Regex: />\(?([+\-]?[0-9,]+\.?[0-9]*)%\)?<\/span>/
        // Mock content: >(0.55%)</span>
        const pctMatch = [null, "0.55"];
        if (pctMatch) {
            changePercent = parseFloat(pctMatch[1].replace(/,/g, ''));
        }

        /* 
           CURRENT LOGIC FLAW:
           change = -179.00
           changePercent = 0.55
           No sync between them.
        */

        return { price, change, changePercent };
    }
}

const result = parseTX(mockHtml);
console.log('Parsed:', result);
console.log('Is Correct?', result.change === -179 && result.changePercent === -0.55);
