import puppeteer from 'puppeteer-core';

const SOURCES = [
    {
        name: 'Shipping Fandom',
        url: (character) => `https://shipping.fandom.com/wiki/${character}`,
        parse: async (character) => {
            try {
                const browser = await puppeteer.launch({
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
                    headless: true,
                    args: ["--no-sandbox", "--disable-setuid-sandbox"]
                });
                const page = await browser.newPage();
                await page.goto(`https://shipping.fandom.com/wiki/${character}`, { waitUntil: 'networkidle2' });
                
                // Take a screenshot for debugging
                await page.screenshot({ path: 'debug.png', fullPage: true });
                
                // Log the page content for debugging
                const pageContent = await page.content();
                console.log(pageContent);
                
                const categories = await page.evaluate(() => {
                    const data = {};
                    document.querySelectorAll('h2').forEach(header => {
                        const category = header.textContent.trim();
                        const ships = [];
                        let next = header.nextElementSibling;
                        while (next && next.tagName !== 'H2') {
                            if (next.tagName === 'UL') {
                                next.querySelectorAll('li a').forEach(ship => {
                                    ships.push(ship.textContent.trim());
                                });
                            }
                            next = next.nextElementSibling;
                        }
                        if (ships.length > 0) {
                            data[category] = ships;
                        }
                    });
                    return data;
                });
                
                await browser.close();
                return categories;
            } catch (error) {
                console.error(`Failed to fetch from Shipping Fandom:`, error.message);
                return {};
            }
        }
    }
];

const scrapeShips = async (character) => {
    const shipData = {};
    for (const source of SOURCES) {
        try {
            shipData[source.name] = await source.parse(character);
        } catch (error) {
            console.error(`Failed to fetch from ${source.name}:`, error.message);
        }
    }
    return shipData;
};

export { scrapeShips };

