import express from 'express';

const router = express.Router();

const YT_FILTERS = new Set(['all', 'channels', 'playlists', 'videos']);

/**
 * @swagger
 * /api/yt_search:
 *   get:
 *     summary: Search YouTube
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, channels, playlists, videos]
 *           default: all
 *         description: Filter results by type
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Continuation token for pagination
 *     responses:
 *       200:
 *         description: YouTube search results with continuation token
 *       400:
 *         description: Missing/invalid params
 */
router.get('/yt_search', async (req, res) => {
  try {
    const { q: query, filter = 'all', continuationToken } = req.query;

    // FIXED: Allow continuation without query
    if (!query && !continuationToken) {
      return res.status(400).json({ error: "Missing required query parameter 'q' or 'continuationToken'" });
    }

    if (!YT_FILTERS.has(filter)) {
      return res.status(400).json({
        error: `Invalid filter. Allowed: ${Array.from(YT_FILTERS).sort()}`
      });
    }

    const youtubeSearch = req.app.locals.youtubeSearch;
    let results = [];
    let nextContinuationToken = null;

    // When continuation token is provided, only search the specific filter type
    if (continuationToken) {
      // FIXED: Don't pass query when using continuation token
      if (filter === 'videos') {
        const videoResults = await youtubeSearch.searchVideos(null, continuationToken);
        results = videoResults.results;
        nextContinuationToken = videoResults.continuationToken;
      } else if (filter === 'channels') {
        const channelResults = await youtubeSearch.searchChannels(null, continuationToken);
        results = channelResults.results;
        nextContinuationToken = channelResults.continuationToken;
      } else if (filter === 'playlists') {
        const playlistResults = await youtubeSearch.searchPlaylists(null, continuationToken);
        results = playlistResults.results;
        nextContinuationToken = playlistResults.continuationToken;
      }
    } else {
      // Initial search without continuation token
      if (filter === 'videos' || filter === 'all') {
        const videoResults = await youtubeSearch.searchVideos(query, null);
        results.push(...videoResults.results);
        nextContinuationToken = videoResults.continuationToken;
      }

      if (filter === 'channels' || filter === 'all') {
        const channelResults = await youtubeSearch.searchChannels(query, null);
        results.push(...channelResults.results);
        if (!nextContinuationToken) nextContinuationToken = channelResults.continuationToken;
      }

      if (filter === 'playlists' || filter === 'all') {
        const playlistResults = await youtubeSearch.searchPlaylists(query, null);
        results.push(...playlistResults.results);
        if (!nextContinuationToken) nextContinuationToken = playlistResults.continuationToken;
      }
    }

    // Include continuationToken at the end
    res.json({
      filter,
      query: query || null,
      results,
      continuationToken: nextContinuationToken
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: `Search failed: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/yt_channel/{channelId}:
 *   get:
 *     summary: Get YouTube channel information
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube channel ID
 *     responses:
 *       200:
 *         description: Channel information
 *       400:
 *         description: Invalid channel ID
 */
router.get('/yt_channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const youtubeSearch = req.app.locals.youtubeSearch;

    // Get channel info using search
    const channelResults = await youtubeSearch.searchChannels(`channel:${channelId}`, null);

    if (channelResults.results.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({
      channelId,
      channelInfo: channelResults.results[0]
    });
  } catch (error) {
    console.error('YouTube channel error:', error);
    res.status(500).json({ error: `Failed to get channel info: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/yt_playlists:
 *   get:
 *     summary: Search YouTube playlists
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for playlists
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Continuation token for pagination
 *     responses:
 *       200:
 *         description: YouTube playlists with continuation token
 *       400:
 *         description: Missing/invalid params
 */
router.get('/yt_playlists', async (req, res) => {
  try {
    const { q: query, continuationToken } = req.query;

    // FIXED: Allow continuation without query
    if (!query && !continuationToken) {
      return res.status(400).json({ error: "Missing required query parameter 'q' or 'continuationToken'" });
    }

    const youtubeSearch = req.app.locals.youtubeSearch;
    const playlistResults = await youtubeSearch.searchPlaylists(
      query || null, 
      continuationToken
    );

    res.json({
      query: query || null,
      playlists: playlistResults.results,
      continuationToken: playlistResults.continuationToken
    });
  } catch (error) {
    console.error('YouTube playlists error:', error);
    res.status(500).json({ error: `Failed to search playlists: ${error.message}` });
  }
});

export default router;
