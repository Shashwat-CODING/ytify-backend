const YTMusic = require('./lib/ytmusicapi');

async function test() {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    try {
        console.log('Testing getAlbum...');
        const albumId = 'OLAK5uy_mn4bVn2p6euKdr9dO39lJalvMMFvvdveE';
        try {
            const album = await ytmusic.getAlbum(albumId);
            console.log('Album Title:', album.title);
            console.log('Album Tracks:', album.tracks?.length);
        } catch (e) {
            console.log('getAlbum failed, trying getPlaylist for album ID...');
            const albumAsPlaylist = await ytmusic.getPlaylist(albumId);
            console.log('Album (as Playlist) Title:', albumAsPlaylist.title);
            console.log('Album (as Playlist) Tracks:', albumAsPlaylist.tracks?.length);
        }
    } catch (error) {
        console.error('Album fetch failed:', error.message);
    }

    try {
        console.log('\nTesting getPlaylist...');
        const playlistId = 'RDCLAK5uy_l7wbZbRzGqC5J0T49h-tpF0s9k6s8'; // Top 100 India
        const playlist = await ytmusic.getPlaylist(playlistId);
        console.log('Playlist Title:', playlist.title);
        console.log('Playlist Tracks:', playlist.tracks?.length);
        if (playlist.tracks?.length > 0) {
            console.log('First Track:', playlist.tracks[0].title);
        }
    } catch (error) {
        console.error('getPlaylist failed:', error.message);
    }
}

test();
