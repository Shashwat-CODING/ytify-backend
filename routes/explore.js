const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/charts:
 *   get:
 *     summary: Get charts (global or by country)
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code
 *     responses:
 *       200:
 *         description: Charts data
 *       500:
 *         description: Charts data unavailable
 */
router.get('/charts', async (req, res) => {
  try {
    const { country } = req.query;
    const ytmusic = req.app.locals.ytmusic;
    
    const data = await ytmusic.getCharts(country);
    res.json(data);
  } catch (error) {
    console.error('Charts error:', error);
    const errorMsg = error.message || 'Charts service temporarily unavailable';
    res.status(500).json({
      error: `Charts data unavailable: ${errorMsg}`,
      message: 'YouTube Music charts are currently not accessible. This may be due to regional restrictions or service limitations.',
      fallback: 'Try using the search endpoint instead: /api/search?q=trending&filter=songs'
    });
  }
});

/**
 * @swagger
 * /api/moods:
 *   get:
 *     summary: Get mood/genre categories
 *     responses:
 *       200:
 *         description: Mood categories
 *       500:
 *         description: Mood categories unavailable
 */
router.get('/moods', async (req, res) => {
  try {
    const ytmusic = req.app.locals.ytmusic;
    const data = await ytmusic.getMoodCategories();
    res.json(data);
  } catch (error) {
    console.error('Moods error:', error);
    const errorMsg = error.message || 'Mood categories service temporarily unavailable';
    res.status(500).json({
      error: `Mood categories unavailable: ${errorMsg}`,
      message: 'YouTube Music mood categories are currently not accessible.',
      fallback: 'Try using the search endpoint instead: /api/search?q=relaxing&filter=playlists'
    });
  }
});

/**
 * @swagger
 * /api/moods/{categoryId}:
 *   get:
 *     summary: Get playlists for a mood/genre category
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Mood playlists
 *       500:
 *         description: Mood playlists unavailable
 */
router.get('/moods/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const ytmusic = req.app.locals.ytmusic;
    
    const data = await ytmusic.getMoodPlaylists(categoryId);
    res.json(data);
  } catch (error) {
    console.error('Mood playlists error:', error);
    const errorMsg = error.message || 'Mood playlists service temporarily unavailable';
    res.status(500).json({
      error: `Mood playlists unavailable: ${errorMsg}`,
      message: `Mood playlists for category '${req.params.categoryId}' are currently not accessible.`,
      fallback: 'Try using the search endpoint instead: /api/search?q=mood&filter=playlists'
    });
  }
});

/**
 * @swagger
 * /api/watch_playlist:
 *   get:
 *     summary: Get watch playlist (radio/shuffle)
 *     parameters:
 *       - in: query
 *         name: videoId
 *         schema:
 *           type: string
 *         description: Video ID
 *       - in: query
 *         name: playlistId
 *         schema:
 *           type: string
 *         description: Playlist ID
 *       - in: query
 *         name: radio
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Radio mode
 *       - in: query
 *         name: shuffle
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Shuffle mode
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Maximum number of tracks
 *     responses:
 *       200:
 *         description: Watch playlist data
 *       400:
 *         description: Missing params
 */
router.get('/watch_playlist', async (req, res) => {
  try {
    const { videoId, playlistId, radio = false, shuffle = false, limit = 25 } = req.query;
    
    if (!videoId && !playlistId) {
      return res.status(400).json({ error: 'Provide either videoId or playlistId' });
    }

    const ytmusic = req.app.locals.ytmusic;
    const data = await ytmusic.getWatchPlaylist(
      videoId, 
      playlistId, 
      radio === 'true', 
      shuffle === 'true', 
      parseInt(limit)
    );
    
    res.json(data);
  } catch (error) {
    console.error('Watch playlist error:', error);
    res.status(500).json({ error: `Watch playlist unavailable: ${error.message}` });
  }
});

module.exports = router;
