const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('--- Verifying Search ---');
        const searchResp = await axios.get(`${BASE_URL}/search?q=Thriller&filter=albums`);
        console.log('Search Status:', searchResp.status);

        let albumId;
        if (searchResp.data.results?.length > 0) {
            albumId = searchResp.data.results[0].browseId || searchResp.data.results[0].id; // Adjust based on actual search response
            console.log('Found Album ID:', albumId);
        } else {
            console.log('No albums found in search');
            // Fallback to a known ID if search fails (though search should work)
            // albumId = 'MPREb_scJdt1M0j0H'; 
        }

        if (albumId) {
            console.log('\n--- Verifying Album Endpoint ---');
            try {
                const albumResp = await axios.get(`${BASE_URL}/album/${albumId}`);
                console.log('Album Status:', albumResp.status);
                console.log('Album Title:', albumResp.data.title);
                console.log('Album Tracks:', albumResp.data.tracks?.length);
            } catch (e) {
                console.error('Album Endpoint Error:', e.response?.data || e.message);
            }
        }

        console.log('\n--- Verifying Playlist Search ---');
        const plSearchResp = await axios.get(`${BASE_URL}/search?q=Top 100&filter=playlists`);
        let playlistId;
        if (plSearchResp.data.results?.length > 0) {
            playlistId = plSearchResp.data.results[0].browseId || plSearchResp.data.results[0].id;
            console.log('Found Playlist ID:', playlistId);
        }

        if (playlistId) {
            console.log('\n--- Verifying Playlist Endpoint ---');
            try {
                const plResp = await axios.get(`${BASE_URL}/playlist/${playlistId}`);
                console.log('Playlist Status:', plResp.status);
                console.log('Playlist Title:', plResp.data.title);
                console.log('Playlist Tracks:', plResp.data.tracks?.length);
            } catch (e) {
                console.error('Playlist Endpoint Error:', e.response?.data || e.message);
            }
        }

    } catch (error) {
        console.error('Verification Error:', error.message);
    }
})();
