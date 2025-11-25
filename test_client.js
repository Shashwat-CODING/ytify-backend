const client = require('./lib/youtubei-client');

(async () => {
    try {
        console.log('Initializing client...');
        await client.ensureInitialized();

        // Test Album (using a known ID or searching first if needed, but let's try a direct ID if we have one, 
        // otherwise we might need to search. The previous test failed on direct ID, so let's try to search first 
        // to be safe, or use the ID from the previous successful search if any. 
        // Wait, the previous search for 'Thriller' didn't give an ID easily.
        // Let's try to search and then get.)

        console.log('\n--- Test: Get Album ---');
        const yt = await client.ensureInitialized();
        const search = await yt.music.search('Thriller');
        console.log('Search results found:', search.results?.length || 0);

        if (search.results?.length > 0) {
            // Find first album in results
            const albumResult = search.results.find(r => r.type === 'Album' || r.type === 'album');
            if (albumResult) {
                console.log('Found Album ID:', albumResult.id);
                const album = await client.getAlbum(albumResult.id);
                console.log('Normalized Album:', JSON.stringify(album, null, 2));
            } else {
                console.log('No album type found in generic search results');
                console.log('First result type:', search.results[0].type);
            }
        } else {
            console.log('No results found');
        }

        console.log('\n--- Test: Get Playlist ---');
        const plSearch = await yt.music.search('Top 100', { type: 'playlist' });
        if (plSearch.results?.length > 0) {
            const plId = plSearch.results[0].id;
            console.log('Found Playlist ID:', plId);
            const playlist = await client.getPlaylist(plId);
            console.log('Normalized Playlist:', JSON.stringify(playlist, null, 2));
        } else {
            console.log('No playlist found to test');
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
})();
