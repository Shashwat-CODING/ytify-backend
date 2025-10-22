const axios = require('axios');

const YTMUSIC_API_URL = 'https://music.youtube.com/youtubei/v1/search';

async function searchArtists(query, authData) {
    const requestBody = {
        context: {
            client: {
                clientName: 'WEB_REMIX',
                clientVersion: '1.20251015.03.00',
                hl: 'en',
                gl: 'IN'
            }
        },
        query: query,
        params: 'EgWKAQIgAWoKEAMQBBAJEAoQBQ%3D%3D' // This is the encoded filter for artists
    };

    const headers = {
        'authority': 'music.youtube.com',
        'content-type': 'application/json',
        'origin': 'https://music.youtube.com',
        'authorization': authData.authorization || '',
        'cookie': authData.cookie || ''
    };

    try {
        const response = await axios.post(YTMUSIC_API_URL, requestBody, { headers });
        
        // Extract artist results from response
        const artistResults = response.data.contents?.tabbedSearchResultsRenderer
            ?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
            ?.contents?.find(content => 
                content?.musicShelfRenderer?.title?.runs?.[0]?.text === 'Artists'
            );

        if (!artistResults) {
            return { success: false, message: 'No artists found', data: [] };
        }

        const artists = artistResults.musicShelfRenderer.contents.map(item => ({
            name: item.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text,
            id: item.musicResponsiveListItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
            thumbnail: item.musicResponsiveListItemRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url
        }));

        return { success: true, data: artists };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            data: []
        };
    }
}

module.exports = { searchArtists };
