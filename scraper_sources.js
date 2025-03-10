export const SOURCES = [
    {
        name: 'Shipping Fandom',
        url: (character) => `https://shipping.fandom.com/wiki/${character}`,
        categorySelectors: {
            Romantic: 'h2:contains("Romantic") + ul li a',
            Friendship: 'h2:contains("Friendship") + ul li a',
            Rivalry: 'h2:contains("Rivalry") + ul li a',
            Family: 'h2:contains("Family") + ul li a'
        }
    },
    {
        name: 'AniList',
        url: (character) => `https://anilist.co/search/characters?search=${character}`,
        api: true
    },
    {
        name: 'MyAnimeList',
        url: (character) => `https://myanimelist.net/search/all?q=${character}&cat=character`,
        api: false
    }
];

export const fetchAniListShips = async (character) => {
    // Placeholder function for AniList API scraping
    return [`AniList ship 1 for ${character}`, `AniList ship 2 for ${character}`];
};

export const fetchMALShips = async (character) => {
    // Placeholder function for MyAnimeList API scraping
    return [`MAL ship 1 for ${character}`, `MAL ship 2 for ${character}`];
};
