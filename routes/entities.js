const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getArtistsData } = require('../lib/youtube_artist');

/**
 * @swagger
 * /api/songs/{videoId}:
 *   get:
 *     summary: Get song details
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: YouTube video ID
 *     responses:
 *       200:
 *         description: Song metadata
 *       500:
 *         description: Song data unavailable
 */
router.get('/songs/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const ytmusic = req.app.locals.ytmusic;

    const data = await ytmusic.getSong(videoId);
    res.json(data);
  } catch (error) {
    console.error('Song error:', error);
    res.status(500).json({ error: `Song data unavailable: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/albums/{browseId}:
 *   get:
 *     summary: Get album details
 *     parameters:
 *       - in: path
 *         name: browseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Album browse ID
 *     responses:
 *       200:
 *         description: Album metadata and tracks
 *       500:
 *         description: Album data unavailable
 */
router.get('/albums/:browseId', async (req, res) => {
  try {
    const { browseId } = req.params;
    const ytmusic = req.app.locals.ytmusic;

    const data = await ytmusic.getAlbum(browseId);
    res.json(data);
  } catch (error) {
    console.error('Album error:', error);
    res.status(500).json({ error: `Album data unavailable: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/artists/{browseId}:
 *   get:
 *     summary: Get artist details
 *     parameters:
 *       - in: path
 *         name: browseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist browse ID
 *     responses:
 *       200:
 *         description: Artist info and releases
 *       500:
 *         description: Artist data unavailable
 */
router.get('/artists/:browseId', async (req, res) => {
  try {
    const { browseId } = req.params;
    const ytmusic = req.app.locals.ytmusic;

    const data = await ytmusic.getArtist(browseId);
    res.json(data);
  } catch (error) {
    console.error('Artist error:', error);
    res.status(500).json({ error: `Artist data unavailable: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/playlists/{playlistId}:
 *   get:
 *     summary: Get playlist details
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Playlist ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of tracks
 *     responses:
 *       200:
 *         description: Playlist metadata and items
 *       500:
 *         description: Playlist data unavailable
 */
router.get('/playlists/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { limit = 100 } = req.query;
    const ytmusic = req.app.locals.ytmusic;

    const data = await ytmusic.getPlaylist(playlistId, parseInt(limit));
    res.json(data);
  } catch (error) {
    console.error('Playlist error:', error);
    res.status(500).json({ error: `Playlist data unavailable: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/artist/{artistId}:
 *   get:
 *     summary: Get artist summary via youtubei browse (Top songs, recommendations, featured-on)
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ID
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           default: US
 *         description: Country code
 *     responses:
 *       200:
 *         description: Artist summary payload
 *       500:
 *         description: Artist data unavailable
 */
router.get('/artist/:artistId', async (req, res) => {
  const { artistId } = req.params;
  const countryCode = req.headers['x-vercel-ip-country'] || 'US';

  try {
    const result = await getArtistsData(artistId, countryCode);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in API handler (GET):', error);
    if (error.message === 'Artist not found') {
      return res.status(404).json({ error: 'Artist not found' });
    }
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
