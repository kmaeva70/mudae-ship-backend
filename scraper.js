import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCES = [
    {
        name: 'Shipping Fandom',
        url: (character) => `https://shipping.fandom.com/wiki/${character}`,
        parse: ($) => {
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
        }
    }
    // Future: Add more sources like MyAnimeList, AniList
];

export const scrapeShips = async (character) => {
    const shipData = {};
    for (const source of SOURCES) {
        try {
            const response = await axios.get(source.url(character));
            const $ = cheerio.load(response.data);
            shipData[source.name] = source.parse($);
        } catch (error) {
            console.error(`Failed to fetch from ${source.name}:`, error.message);
        }
    }
    return shipData;
};
