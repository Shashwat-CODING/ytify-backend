const YTMusic = require('ytmusic-api').default;

const ytmusic = new YTMusic();

async function searchArtist(query) {
    try {
        await ytmusic.initialize();
        
        // Specifically search for artists using the correct filter
        const results = await ytmusic.search(query, {
            filter: 'artists',
            limit: 10
        });

        // Additional verification to ensure we got artist results
        const artistResults = results.filter(item => item.type === 'artist');

        if (artistResults.length === 0) {
            return {
                success: false,
                message: 'No artists found',
                data: []
            };
        }

        return {
            success: true,
            data: artistResults.map(artist => ({
                name: artist.name,
                id: artist.browseId,
                thumbnail: artist.thumbnails ? artist.thumbnails[0].url : null
            }))
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
}

module.exports = { searchArtist };
