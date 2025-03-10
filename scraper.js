import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

const SOURCES = [
    {
        name: 'Shipping Fandom',
        url: (character) => `https://shipping.fandom.com/wiki/${character}`,
        parse: async (character) => {
            try {
                const response = await axios.get(`https://shipping.fandom.com/wiki/${character}`);
                const $ = cheerio.load(response.data);
                const categories = {};
                
                $('h2').each((_, element) => {
                    const category = $(element).text().trim();
                    const ships = [];
                    
                    $(element).nextUntil('h2', 'ul').find('li a').each((_, ship) => {
                        ships.push($(ship).text().trim());
                    });
                    
                    if (ships.length > 0) {
                        categories[category] = ships;
                    }
                });
                
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

