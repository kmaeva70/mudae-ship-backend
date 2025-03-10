import puppeteer from 'puppeteer';

const SOURCES = [
    {
        name: 'Shipping Fandom',
        url: (character) => `https://shipping.fandom.com/wiki/${character}`,
        parse: async (character) => {
            try {
                const browser = await puppeteer.launch({ headless: true });
                const page = await browser.newPage();
                await page.goto(`https://shipping.fandom.com/wiki/${character}`, { waitUntil: 'domcontentloaded' });
                
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

export default scrapeShips;

