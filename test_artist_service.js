const { getArtistsData } = require('./backend/services/youtube_artist');

(async () => {
  try {
    // Test Single Artist (Ed Sheeran)
    // Using the channel ID found earlier: UC0C-w0YjGpqDXGB8IHb662A
    console.log('--- Testing Single Artist ---');
    const singleResult = await getArtistsData('UC0C-w0YjGpqDXGB8IHb662A');
    console.log('Name:', singleResult.artistName);
    console.log('Thumbnail:', singleResult.thumbnail ? 'Found' : 'Missing');
    console.log('PlaylistID (Top Songs):', singleResult.playlistId);
    console.log('Albums:', singleResult.albums?.length);
    console.log('Recommended:', singleResult.recommendedArtists?.length);
    console.log('Featured On:', singleResult.featuredOnPlaylists?.length);
    
    // Test Multiple Artists
    console.log('\n--- Testing Multiple Artists ---');
    // Ed Sheeran and maybe another one (Taylor Swift: UCqECaJ8Gagnn7YCbPEzWH6g)
    const multiResult = await getArtistsData('UC0C-w0YjGpqDXGB8IHb662A,UCqECaJ8Gagnn7YCbPEzWH6g');
    console.log('Results count:', multiResult.length);
    multiResult.forEach((r, i) => {
        console.log(`Artist ${i+1}:`, r.artistName);
        console.log(`  Albums present?`, 'albums' in r); // Should be false
    });

  } catch (error) {
    console.error('Test Failed:', error);
  }
})();
