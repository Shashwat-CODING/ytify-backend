const express = require('express');
const axios = require('axios');
const router = express.Router();
const youtubeiClient = require('../lib/youtubei-client');

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
    // Use the new youtubei client
    const data = await youtubeiClient.getAlbum(browseId);
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
    // Use the new youtubei client
    const data = await youtubeiClient.getPlaylist(playlistId);
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
  try {
    const { artistId } = req.params;
    const { country = 'US' } = req.query;

    const YOUTUBE_MUSIC_API_URL = 'https://summer-darkness-1435.bob17040246.workers.dev/youtubei/v1/browse?prettyPrint=false';

    const body = {
      browseId: artistId,
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20250915.03.00',
          gl: country
        }
      }
    };

    const response = await axios.post(YOUTUBE_MUSIC_API_URL, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    if (response.status !== 200) {
      return res.status(500).json({ error: `HTTP error: ${response.status}` });
    }

    const data = response.data;

    // Parse like the Python logic
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const artistHeader = data?.header?.musicImmersiveHeaderRenderer?.title?.runs?.[0]?.text;

    // Top songs shelf
    let playlistId = null;
    for (const item of contents) {
      if (item.musicShelfRenderer) {
        const titleRuns = item.musicShelfRenderer.title?.runs || [];
        if (titleRuns[0]?.text === 'Top songs') {
          try {
            playlistId = item.musicShelfRenderer.contents?.[0]?.musicResponsiveListItemRenderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.playlistId;
          } catch (e) {
            playlistId = null;
          }
          break;
        }
      }
    }

    // Recommended artists
    let recommendedArtists = null;
    for (const item of contents) {
      if (item.musicCarouselShelfRenderer) {
        const header = item.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer;
        const headerTitle = header?.title?.runs?.[0]?.text;
        if (headerTitle === 'Fans might also like') {
          recommendedArtists = [];
          for (const it of item.musicCarouselShelfRenderer.contents || []) {
            const twoRow = it.musicTwoRowItemRenderer;
            if (twoRow) {
              recommendedArtists.push({
                name: twoRow.title?.runs?.[0]?.text,
                browseId: twoRow.navigationEndpoint?.browseEndpoint?.browseId,
                thumbnail: twoRow.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url
              });
            }
          }
          break;
        }
      }
    }

    // Featured on
    let featuredOnPlaylists = null;
    for (const item of contents) {
      if (item.musicCarouselShelfRenderer) {
        const header = item.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer;
        const headerTitle = header?.title?.runs?.[0]?.text;
        if (headerTitle === 'Featured on') {
          featuredOnPlaylists = [];
          for (const it of item.musicCarouselShelfRenderer.contents || []) {
            const twoRow = it.musicTwoRowItemRenderer;
            if (twoRow) {
              featuredOnPlaylists.push({
                title: twoRow.title?.runs?.[0]?.text,
                browseId: twoRow.navigationEndpoint?.browseEndpoint?.browseId,
                thumbnail: twoRow.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url
              });
            }
          }
          break;
        }
      }
    }

    res.json({
      artistName: artistHeader,
      playlistId,
      recommendedArtists,
      featuredOnPlaylists
    });
  } catch (error) {
    console.error('Artist summary error:', error);
    res.status(500).json({ error: `Artist data unavailable: ${error.message}` });
  }
});

module.exports = router;
