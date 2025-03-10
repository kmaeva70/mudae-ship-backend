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
