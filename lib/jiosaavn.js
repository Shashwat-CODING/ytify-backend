const axios = require('axios');

class JioSaavn {
  constructor() {
    this.baseURL = 'https://saavn-ytify.vercel.app/api';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Search for music on JioSaavn using saavn-ytify upstream
   * @param {string} title - Song title
   * @param {string} artist - Artist name(s), comma separated
   * @param {boolean} debug - Enable debug mode
   * @returns {Promise<Object>} Song information with download URL
   */
  async search(title, artist, debug = false) {
    try {
      // Decode artist string in case it's URL encoded (e.g. Talwiinder%2CSanjoy)
      const decodedArtist = decodeURIComponent(artist || '');
      const requestedArtists = decodedArtist.split(',').map(a => a.trim()).filter(Boolean);

      // New upstream API requests only by title now as per instructions
      const url = `${this.baseURL}/search/songs?query=${encodeURIComponent(title)}&page=0&limit=10`;

      console.log(`[JioSaavn] /jiosaavn/search/strict title='${title}' artists='${JSON.stringify(requestedArtists)}' url='${url}'`);

      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });
      const duration = Date.now() - startTime;

      console.log(`[JioSaavn] status=${response.status} time_ms=${duration} content_type='${response.headers['content-type']}'`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error('Invalid response format from JioSaavn upstream API');
      }

      const results = response.data.data.results || [];
      console.log(`[JioSaavn] results_count=${results.length}`);

      if (results.length === 0) {
        throw new Error('Music stream not found in JioSaavn results');
      }

      // Process results - adapt new format to internal format
      const processedResults = results.map(rawSong => this._createSongPayload(rawSong));

      // Find strict matching track
      const matchingTrack = this._findStrictMatchingTrack(processedResults, title, requestedArtists, debug);

      if (!matchingTrack) {
        throw new Error('Music stream not found in JioSaavn results (Strict Match Failed)');
      }

      // Create final response
      const finalResponse = {
        name: matchingTrack.name,
        year: matchingTrack.year,
        copyright: matchingTrack.copyright,
        duration: matchingTrack.duration,
        label: matchingTrack.label,
        albumName: matchingTrack.album?.name || null,
        artists: [
          ...(matchingTrack.artists?.primary || []),
          ...(matchingTrack.artists?.featured || []),
          ...(matchingTrack.artists?.all || [])
        ],
        downloadUrl: matchingTrack.downloadUrl
      };

      if (debug) {
        finalResponse._debug = {
          queried_url: url,
          time_ms: duration,
          matched_artists: matchingTrack.artists
        };
      }

      return finalResponse;
    } catch (error) {
      console.error(`[JioSaavn][ERR] ${error.message}`);
      throw new Error(`JioSaavn search failed: ${error.message}`);
    }
  }

  /**
   * Search for all music results on JioSaavn
   * @param {string} query - Search query
   * @param {number} limit - Number of results to return
   * @param {boolean} debug - Enable debug mode
   * @returns {Promise<Object>} All matching songs
   */
  async searchAll(query, limit = 10, debug = false) {
    try {
      const url = `${this.baseURL}/search/songs?query=${encodeURIComponent(query)}&page=0&limit=${limit}`;

      console.log(`[JioSaavn] /jiosaavn/search/all q='${query}' limit=${limit} url='${url}'`);

      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });
      const duration = Date.now() - startTime;

      console.log(`[JioSaavn] status=${response.status} time_ms=${duration} content_type='${response.headers['content-type']}'`);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error('Invalid response format from JioSaavn upstream API');
      }

      const results = response.data.data.results || [];
      console.log(`[JioSaavn] results_count=${results.length}`);

      if (results.length === 0) {
        return { results: [] };
      }

      // Process all results
      const processedResults = results.map(rawSong => this._createSongPayload(rawSong));
      console.log(`[JioSaavn] processed_count=${processedResults.length} sample_titles=${processedResults.slice(0, 3).map(r => r.name)}`);

      const response_data = {
        query,
        total: processedResults.length,
        results: processedResults
      };

      if (debug) {
        response_data._debug = {
          queried_url: url,
          time_ms: duration
        };
      }

      return response_data;
    } catch (error) {
      console.error(`[JioSaavn][ERR] ${error.message}`);
      throw new Error(`JioSaavn search all failed: ${error.message}`);
    }
  }

  // Private helper methods

  _createSongPayload(rawSong) {
    // Process download URLs to find the best quality
    let downloadUrl = '';
    if (Array.isArray(rawSong.downloadUrl) && rawSong.downloadUrl.length > 0) {
      // 1. Try to find 320kbps
      const q320 = rawSong.downloadUrl.find(Link => Link.quality === '320kbps') || rawSong.downloadUrl.find(Link => Link.quality === '320kbps' || Link.quality === '320');
      // 2. Try to find 160kbps
      const q160 = rawSong.downloadUrl.find(Link => Link.quality === '160kbps') || rawSong.downloadUrl.find(Link => Link.quality === '160kbps' || Link.quality === '160');
      // 3. Fallback to the last one (usually highest if sorted, or just an available one)
      const best = q320 || q160 || rawSong.downloadUrl[rawSong.downloadUrl.length - 1];
      downloadUrl = best.url || best.link || '';
    } else if (typeof rawSong.downloadUrl === 'string') {
      downloadUrl = rawSong.downloadUrl;
    } else if (rawSong.url) {
      // Fallback if no specific downloadUrl structure (though the new API seems to have it)
      downloadUrl = rawSong.url;
    }

    // Process artists from the new structure
    // New API format: artists: { primary: [...], featured: [...], all: [...] }
    const mapArtist = (a) => ({
      name: a.name || '',
      id: a.id || '',
      role: a.role || ''
    });

    const primaryArtists = (rawSong.artists?.primary || []).map(mapArtist);
    const featuredArtists = (rawSong.artists?.featured || []).map(mapArtist);
    const allArtists = (rawSong.artists?.all || []).map(mapArtist);

    return {
      name: rawSong.name || '',
      year: rawSong.year || '',
      copyright: rawSong.copyright || '',
      duration: rawSong.duration || '', // Note: New API might return seconds as number
      label: rawSong.label || '',
      album: {
        name: rawSong.album?.name || '',
        id: rawSong.album?.id || ''
      },
      artists: {
        primary: primaryArtists,
        featured: featuredArtists,
        all: allArtists
      },
      downloadUrl: downloadUrl,
      image: (rawSong.image && rawSong.image.length > 0) ? (rawSong.image[rawSong.image.length - 1].url || rawSong.image[rawSong.image.length - 1].link) : '',
      language: rawSong.language || '',
      hasLyrics: rawSong.hasLyrics || false
    };
  }

  _findStrictMatchingTrack(processedResults, title, requestedArtists, debug) {
    const normalizeString = (text) => {
      // Remove special characters but keep spaces for internal word separation if needed
      return (text || '').toString().trim().toLowerCase().replace(/[^\w\s]/g, '');
    };

    // Create a normalized set of requested artists for easier comparison
    const normalizedRequestedArtists = new Set(requestedArtists.map(a => normalizeString(a)));
    const requiredCount = normalizedRequestedArtists.size;

    console.log(`[JioSaavn][Strict] Searching for title='${title}' with ${requiredCount} artists: ${[...normalizedRequestedArtists].join(', ')}`);

    for (const track of processedResults) {
      // 1. Check title match first
      const trackName = normalizeString(track.name);
      const searchTitle = normalizeString(title);

      // Simple contains/starts with check for title
      const titleMatches = trackName.includes(searchTitle) || searchTitle.includes(trackName);

      if (!titleMatches) continue;

      // 2. Strict Artist Check
      // Get all primary artists from the track
      // Usage of primary artists is generally safer for strict matching than including all (lyricists etc)
      const primaryArtists = (track.artists?.primary || []).map(a => a.name);

      // Let's normalize track artists
      const trackArtistsNormalized = new Set(primaryArtists.map(a => normalizeString(a)));
      const trackArtistCount = trackArtistsNormalized.size;

      let artistMatch = false;
      let reason = '';

      if (trackArtistCount > requiredCount) {
        reason = `Too many artists (${trackArtistCount} > ${requiredCount})`;
      } else if (trackArtistCount < requiredCount) {
        reason = `Too few artists (${trackArtistCount} < ${requiredCount})`;
      } else {
        // Exact count, now check if they are the same sets
        // Check if every requested artist is in the track artists
        const allFound = [...normalizedRequestedArtists].every(reqArtist =>
          [...trackArtistsNormalized].some(trackArtist => trackArtist.includes(reqArtist) || reqArtist.includes(trackArtist))
        );

        if (allFound) {
          artistMatch = true;
        } else {
          reason = 'Artist names do not match';
        }
      }

      if (debug) {
        console.log(`[JioSaavn][Strict] Track: '${track.name}' Artists: [${primaryArtists.join(', ')}] Match: ${artistMatch} Reason: ${reason}`);
      }

      if (artistMatch) {
        return track;
      }
    }

    console.log('[JioSaavn][Strict] No strict match found.');
    return null;
  }
}

module.exports = JioSaavn;
