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
   * @param {string} artist - Artist name
   * @param {boolean} debug - Enable debug mode
   * @returns {Promise<Object>} Song information with download URL
   */
  async search(title, artist, debug = false) {
    try {
      const searchQuery = `${title} ${artist}`;
      // New upstream API: /api/search/songs?query=...&page=0&limit=10
      const url = `${this.baseURL}/search/songs?query=${encodeURIComponent(searchQuery)}&page=0&limit=10`;

      console.log(`[JioSaavn] /jiosaavn/search title='${title}' artist='${artist}' url='${url}'`);

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
      console.log(`[JioSaavn] processed_count=${processedResults.length} sample_titles=${processedResults.slice(0, 3).map(r => r.name)}`);

      // Find matching track
      const matchingTrack = this._findMatchingTrack(processedResults, title, artist, debug);

      if (!matchingTrack) {
        throw new Error('Music stream not found in JioSaavn results');
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

  // Private helper methods - no longer needed _buildSearchURL as it's simple enough inline

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

  // _parseArtists is no longer needed with the new mapping logic above

  _findMatchingTrack(processedResults, title, artist, debug) {
    const normalizeString = (text) => {
      return (text || '').toString().trim().toLowerCase().replace(/[^\w\s]/g, '');
    };

    const startsEither = (a, b) => {
      return a.startsWith(b) || b.startsWith(a);
    };

    for (const track of processedResults) {
      // Get all artist names
      const primaryArtists = (track.artists?.primary || []).map(a => a.name?.trim()).filter(Boolean);
      const singers = (track.artists?.all || []).filter(a => a.role === 'singer' || a.role === 'primary_artists').map(a => a.name?.trim()).filter(Boolean);
      // Combine and deduplicate
      const allArtists = [...new Set([...primaryArtists, ...singers])];

      // Check if artist matches
      const artistInput = normalizeString(artist);
      let artistMatches = false;

      if (allArtists.length > 0) {
        for (const trackArtistName of allArtists) {
          if (startsEither(artistInput, normalizeString(trackArtistName))) {
            artistMatches = true;
            break;
          }
        }
      }

      // Check if title matches
      const titleMatches = startsEither(normalizeString(title), normalizeString(track.name));

      if (debug) {
        console.log(`[JioSaavn][match_check] track='${track.name}' artists=${allArtists} title_matches=${titleMatches} artist_matches=${artistMatches}`);
      }

      if (titleMatches && (artistMatches || allArtists.length === 0)) {
        return track;
      }
    }

    // Fallback: choose the first with title match only
    const titleOnly = processedResults.find(t =>
      startsEither(normalizeString(title), normalizeString(t.name))
    );

    if (titleOnly) {
      console.log('[JioSaavn] Falling back to title-only match');
      return titleOnly;
    }

    // Log a concise summary to help debugging
    const sample = processedResults.slice(0, 5).map(tr => ({
      name: tr.name,
      artists: (tr.artists?.primary || []).map(a => a.name)
    }));
    console.log(`[JioSaavn] No exact match after processing. sample_candidates=${JSON.stringify(sample)}`);

    return null;
  }
}

module.exports = JioSaavn;

