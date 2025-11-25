const { getArtistsData } = require('./lib/youtube_artist');

async function test() {
    try {
        // Taylor Swift channel ID
        const artistId = 'UCl6JCCyac0i2h_Wjs5r86vA';
        console.log(`Testing getArtistsData for ${artistId}...`);
        const data = await getArtistsData(artistId);

        console.log('Success!');
        console.log('Artist Name:', data.artistName);
        console.log('Thumbnail:', data.thumbnail ? 'Found' : 'Missing');
        console.log('Playlist ID:', data.playlistId);
        console.log('Albums count:', data.albums?.length);
        if (data.albums?.length > 0) {
            console.log('First Album:', data.albums[0]);
        }
        console.log('Recommended Artists count:', data.recommendedArtists?.length);
        console.log('Featured On count:', data.featuredOnPlaylists?.length);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
