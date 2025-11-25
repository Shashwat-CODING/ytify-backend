import axios from 'axios';

class JioSaavn {
  constructor() {
    this.baseURL = 'https://www.jiosaavn.com/api.php';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Search for music on JioSaavn
   * @param {string} title - Song title
   * @param {string} artist - Artist name
   * @param {boolean} debug - Enable debug mode
   * @returns {Promise<Object>} Song information with download URL
   */
  async search(title, artist, debug = false) {
    try {
      const searchQuery = `${title} ${artist}`;
      const url = this._buildSearchURL(searchQuery);
      
      console.log(`[JioSaavn] /jiosaavn/search title='${title}' artist='${artist}' url='${url}'`);
      
      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });
      const duration = Date.now() - startTime;
      
      console.log(`[JioSaavn] status=${response.status} time_ms=${duration} len=${response.data.length} content_type='${response.headers['content-type']}'`);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from JioSaavn API');
      }

      const results = response.data.results || [];
      console.log(`[JioSaavn] results_count=${results.length}`);
      
      if (results.length === 0) {
        throw new Error('Music stream not found in JioSaavn results');
      }

      // Process results
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
      const url = this._buildSearchURL(query, limit);
      
      console.log(`[JioSaavn] /jiosaavn/search/all q='${query}' limit=${limit} url='${url}'`);
      
      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: this.headers,
        timeout: 15000
      });
      const duration = Date.now() - startTime;
      
      console.log(`[JioSaavn] status=${response.status} time_ms=${duration} len=${response.data.length} content_type='${response.headers['content-type']}'`);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from JioSaavn API');
      }

      const results = response.data.results || [];
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
  _buildSearchURL(query, limit = 10) {
    const params = new URLSearchParams({
      _format: 'json',
      _marker: '0',
      api_version: '4',
      ctx: 'web6dot0',
      __call: 'search.getResults',
      q: query,
      p: '0',
      n: limit.toString()
    });

    return `${this.baseURL}?${params.toString()}`;
  }

  _createSongPayload(rawSong) {
    return {
      name: rawSong.title || rawSong.song || '',
      year: rawSong.year || '',
      copyright: rawSong.copyright || '',
      duration: rawSong.duration || '',
      label: rawSong.label || '',
      album: {
        name: rawSong.album || rawSong.album_name || '',
        id: rawSong.album_id || ''
      },
      artists: {
        primary: this._parseArtists(rawSong.primary_artists || rawSong.artists || []),
        featured: this._parseArtists(rawSong.featured_artists || []),
        all: this._parseArtists(rawSong.all_artists || [])
      },
      downloadUrl: rawSong.download_url || rawSong.media_url || rawSong.media_preview_url || '',
      image: rawSong.image || rawSong.thumbnail || '',
      language: rawSong.language || '',
      genre: rawSong.genre || ''
    };
  }

  _parseArtists(artists) {
    if (!Array.isArray(artists)) {
      return [];
    }

    return artists.map(artist => {
      if (typeof artist === 'string') {
        return { name: artist, id: '' };
      }
      return {
        name: artist.name || artist.title || '',
        id: artist.id || ''
      };
    });
  }

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
      const singers = (track.artists?.all || []).filter(a => a.role === 'singer').map(a => a.name?.trim()).filter(Boolean);
      const allArtists = [...primaryArtists, ...singers];

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

export default JioSaavn;
