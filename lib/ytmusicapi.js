const axios = require('axios');

class YTMusic {
  constructor() {
    this.baseURL = (process.env.YTM_BASE_URL || 'https://music.youtube.com') + '/youtubei/v1';
    this.apiKey = 'AIzaSyC9XL3ZjWjXClIX1FmUxJq--EohcD4_oSs';
    this.context = {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion: '1.20250915.03.00',
        hl: 'en',
        gl: 'US',
        theme: 'MUSIC',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    this.visitorData = null; // Will be captured from first response
  }

  async search(query, filter = null, continuationToken = null, ignoreSpelling = false) {
    try {
      const params = this._encodeSearchParams(query, filter, continuationToken, ignoreSpelling);
      const response = await this._makeRequest('search', params);
      return this._parseSearchResults(response);
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getSearchSuggestions(query) {
    try {
      const params = {
        input: query
      };

      const response = await this._makeRequest('music/get_search_suggestions', params);
      return this._parseSuggestions(response);
    } catch (error) {
      throw new Error(`Suggestions failed: ${error.message}`);
    }
  }

  async getSong(videoId) {
    try {
      const params = {
        videoId,
        params: this._encodeVideoParams()
      };

      const response = await this._makeRequest('player', params);
      return this._parseSongDetails(response);
    } catch (error) {
      throw new Error(`Song data unavailable: ${error.message}`);
    }
  }

  async getAlbum(browseId) {
    try {
      const params = {
        browseId,
        context: this.context
      };

      const response = await this._makeRequest('browse', params);
      return this._parseAlbumDetails(response);
    } catch (error) {
      throw new Error(`Album data unavailable: ${error.message}`);
    }
  }

  async getArtist(browseId) {
    try {
      const params = {
        browseId,
        context: this.context
      };

      const response = await this._makeRequest('browse', params);
      return this._parseArtistDetails(response);
    } catch (error) {
      throw new Error(`Artist data unavailable: ${error.message}`);
    }
  }

  async getPlaylist(playlistId, limit = 100) {
    try {
      const params = {
        playlistId,
        params: this._encodePlaylistParams(limit)
      };

      const response = await this._makeRequest('browse', params);
      return this._parsePlaylistDetails(response);
    } catch (error) {
      throw new Error(`Playlist data unavailable: ${error.message}`);
    }
  }

  async getCharts(country = null) {
    try {
      const params = {
        browseId: 'FEmusic_charts',
        context: {
          ...this.context,
          client: {
            ...this.context.client,
            gl: country || 'US'
          }
        }
      };

      const response = await this._makeRequest('browse', params);
      return this._parseChartsData(response);
    } catch (error) {
      throw new Error(`Charts data unavailable: ${error.message}`);
    }
  }

  async getMoodCategories() {
    try {
      const params = {
        browseId: 'FEmusic_moods_and_genres',
        context: this.context
      };

      const response = await this._makeRequest('browse', params);
      return this._parseMoodCategories(response);
    } catch (error) {
      throw new Error(`Mood categories unavailable: ${error.message}`);
    }
  }

  async getMoodPlaylists(categoryId) {
    try {
      const params = {
        browseId: categoryId,
        context: this.context
      };

      const response = await this._makeRequest('browse', params);
      return this._parseMoodPlaylists(response);
    } catch (error) {
      throw new Error(`Mood playlists unavailable: ${error.message}`);
    }
  }

  async getWatchPlaylist(videoId = null, playlistId = null, radio = false, shuffle = false, limit = 25) {
    try {
      const params = {
        videoId,
        playlistId,
        radio,
        shuffle,
        params: this._encodeWatchPlaylistParams(limit)
      };

      const response = await this._makeRequest('next', params);
      return this._parseWatchPlaylist(response);
    } catch (error) {
      throw new Error(`Watch playlist unavailable: ${error.message}`);
    }
  }

  // Private helper methods
  async _makeRequest(endpoint, params) {
    const url = `${this.baseURL}/${endpoint}?key=${this.apiKey}`;
    
    let requestBody;
    
    // Handle continuation tokens - they need ONLY context + continuation
    if (params.continuation) {
      requestBody = {
        context: this.context,
        continuation: params.continuation,
        // Some backends require additional params mirroring web behavior
        params: `&ctoken=${encodeURIComponent(params.continuation)}&continuation=${encodeURIComponent(params.continuation)}`
      };
    } else {
      // For initial search requests
      requestBody = {
        context: this.context,
        ...params
      };
    }
    
    const response = await axios.post(url, requestBody, {
      headers: {
        'User-Agent': this.context.client.userAgent,
        'Content-Type': 'application/json',
        'X-Goog-AuthUser': '0',
        'Origin': 'https://music.youtube.com',
        // Prefer stable headers; only send visitor if previously learned
        ...(this.visitorData ? { 'X-Goog-Visitor-Id': this.visitorData } : {}),
        'X-YouTube-Client-Name': '67', // WEB_REMIX
        'X-YouTube-Client-Version': this.context.client.clientVersion,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://music.youtube.com/'
      }
    });
    
    // Capture stable visitorData from first successful call
    try {
      const vd = response?.data?.responseContext?.visitorData;
      if (vd && !this.visitorData) this.visitorData = vd;
    } catch {}

    return response.data;
  }

  _generateVisitorId() {
    // Deprecated: we now rely on server-provided visitorData
    return null;
  }

  _encodeSearchParams(query, filter = null, continuationToken = null, ignoreSpelling = false) {
    // If continuation token exists, return only the continuation
    if (continuationToken) {
      return {
        continuation: continuationToken
      };
    }

    // For initial search requests
    const searchParams = {
      query: query,
      params: this._getFilterParams(filter)
    };

    if (ignoreSpelling) {
      searchParams.params += '&ignore_spelling=true';
    }

    return searchParams;
  }

  _getFilterParams(filter) {
    const filterMap = {
      'songs': 'Eg-KAQwIARAAGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'videos': 'Eg-KAQwIABABGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'albums': 'Eg-KAQwIABAAGAEgACgAMABqChAEEAUQAxAKEAk%3D',
      'artists': 'Eg-KAQwIAxAAGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'playlists': 'Eg-KAQwIABAAGAAgACgBMABqChAEEAUQAxAKEAk%3D',
      'profiles': 'Eg-KAQwIABABGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'podcasts': 'Eg-KAQwIABABGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'episodes': 'Eg-KAQwIABABGAAgACgAMABqChAEEAUQAxAKEAk%3D',
      'community_playlists': 'Eg-KAQwIABAAGAAgACgBMABqChAEEAUQAxAKEAk%3D'
    };

    return filterMap[filter] || 'Eg-KAQwIARAAGAAgACgAMABqChAEEAUQAxAKEAk%3D';
  }

  _encodeVideoParams() {
    return Buffer.from(JSON.stringify({
      videoId: '',
      context: this.context
    })).toString('base64');
  }

  _encodePlaylistParams(limit) {
    return Buffer.from(JSON.stringify({
      browseId: '',
      params: `6gPTAUNwc0JBRUNBQ0F%3D&limit=${limit}`
    })).toString('base64');
  }

  _encodeWatchPlaylistParams(limit) {
    return Buffer.from(JSON.stringify({
      videoId: '',
      playlistId: '',
      radio: false,
      shuffle: false,
      params: `6gPTAUNwc0JBRUNBQ0F%3D&limit=${limit}`
    })).toString('base64');
  }

  _parseSearchResults(data) {
    const results = [];
    let continuationToken = null;

    // 1) continuationContents (various keys)
    if (data?.continuationContents) {
      const cc = data.continuationContents;
      for (const key of Object.keys(cc)) {
        const block = cc[key];
        const contents = block?.contents || [];
        for (const entry of contents) {
          if (entry.musicShelfRenderer) {
            const shelfItems = entry.musicShelfRenderer.contents || [];
            for (const si of shelfItems) {
              const m = si.musicResponsiveListItemRenderer;
              if (m) {
                const parsed = this._parseMusicItem(m);
                if (parsed) results.push(parsed);
              }
            }
            const cont = entry.musicShelfRenderer?.continuations?.[0];
            continuationToken = cont?.nextContinuationData?.continuation
              || cont?.reloadContinuationData?.continuation
              || continuationToken;
          } else if (entry.musicResponsiveListItemRenderer) {
            const parsed = this._parseMusicItem(entry.musicResponsiveListItemRenderer);
            if (parsed) results.push(parsed);
          } else if (entry.continuationItemRenderer) {
            continuationToken = entry.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || continuationToken;
          }
        }
      }
    }

    // 2) onResponseReceived* (append or reload)
    const actions = data?.onResponseReceivedActions || data?.onResponseReceivedCommands || [];
    for (const action of actions) {
      const append = action?.appendContinuationItemsAction;
      const reload = action?.reloadContinuationItemsCommand;
      const items = append?.continuationItems || reload?.continuationItems || [];
      for (const entry of items) {
        if (entry.musicShelfContinuation) {
          // Continuation node directly
          const shelfItems = entry.musicShelfContinuation.contents || [];
          for (const si of shelfItems) {
            const m = si.musicResponsiveListItemRenderer;
            if (m) {
              const parsed = this._parseMusicItem(m);
              if (parsed) results.push(parsed);
            }
          }
          const cont = entry.musicShelfContinuation?.continuations?.[0];
          continuationToken = cont?.nextContinuationData?.continuation
            || cont?.reloadContinuationData?.continuation
            || continuationToken;
        } else if (entry.musicShelfRenderer) {
          const shelfItems = entry.musicShelfRenderer.contents || [];
          for (const si of shelfItems) {
            const m = si.musicResponsiveListItemRenderer;
            if (m) {
              const parsed = this._parseMusicItem(m);
              if (parsed) results.push(parsed);
            }
          }
          const cont = entry.musicShelfRenderer?.continuations?.[0];
          continuationToken = cont?.nextContinuationData?.continuation
            || cont?.reloadContinuationData?.continuation
            || continuationToken;
        } else if (entry.musicResponsiveListItemRenderer) {
          const parsed = this._parseMusicItem(entry.musicResponsiveListItemRenderer);
          if (parsed) results.push(parsed);
        } else if (entry.continuationItemRenderer) {
          continuationToken = entry.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || continuationToken;
        }
      }
    }

    // 3) initial contents
    if (results.length === 0) {
      const initial = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      for (const section of initial) {
        if (section.musicShelfRenderer) {
          const items = section.musicShelfRenderer.contents || [];
          for (const it of items) {
            const m = it.musicResponsiveListItemRenderer;
            if (m) {
              const parsed = this._parseMusicItem(m);
              if (parsed) results.push(parsed);
            }
          }
          const cont = section.musicShelfRenderer?.continuations?.[0];
          continuationToken = cont?.nextContinuationData?.continuation
            || cont?.reloadContinuationData?.continuation
            || continuationToken;
        }
        if (section.continuationItemRenderer) {
          continuationToken = section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || continuationToken;
        }
      }
    }

    return { results, continuationToken };
  }

  _parseSuggestions(data) {
    const suggestions = [];
    // Some responses return an array of contents directly
    const directContents = Array.isArray(data?.contents) ? data.contents : [];
    // Others wrap suggestions in a section renderer
    const sectionContents = data?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents || [];

    const allContents = [...directContents, ...sectionContents];

    allContents.forEach(content => {
      const runs = content?.searchSuggestionRenderer?.suggestion?.runs || [];
      let suggestionText = '';
      runs.forEach(run => {
        if (run.text) suggestionText += run.text;
      });
      if (suggestionText) suggestions.push(suggestionText);
    });

    return suggestions;
  }

  _parseSongDetails(data) {
    const videoDetails = data?.videoDetails || {};
    const microformat = data?.microformat?.microformatDataRenderer || {};
    
    return {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      author: videoDetails.author,
      lengthSeconds: videoDetails.lengthSeconds,
      thumbnail: videoDetails.thumbnail?.thumbnails?.[0]?.url,
      description: microformat.description,
      category: microformat.category
    };
  }

  _parseAlbumDetails(data) {
    const header = data?.header?.musicDetailHeaderRenderer || data?.header?.musicImmersiveHeaderRenderer || {};
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    
    return {
      title: header.title?.runs?.[0]?.text,
      artist: header.subtitle?.runs?.[0]?.text,
      thumbnail: header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url,
      tracks: this._parseTracksFromContents(contents)
    };
  }

  _parseArtistDetails(data) {
    const header = data?.header?.musicImmersiveHeaderRenderer || data?.header?.musicVisualHeaderRenderer || {};
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    
    return {
      name: header.title?.runs?.[0]?.text,
      description: header.description?.runs?.[0]?.text,
      thumbnail: header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url,
      albums: this._parseAlbumsFromContents(contents),
      singles: this._parseSinglesFromContents(contents)
    };
  }

  _parsePlaylistDetails(data) {
    const header = data?.header?.musicDetailHeaderRenderer || {};
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    
    return {
      title: header.title?.runs?.[0]?.text,
      author: header.subtitle?.runs?.[0]?.text,
      thumbnail: header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url,
      tracks: this._parseTracksFromContents(contents)
    };
  }

  _parseChartsData(data) {
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const charts = [];

    contents.forEach(section => {
      if (section.musicShelfRenderer) {
        const title = section.musicShelfRenderer.title?.runs?.[0]?.text;
        const items = section.musicShelfRenderer.contents || [];
        const chartItems = items.map(item => this._parseMusicItem(item.musicResponsiveListItemRenderer)).filter(Boolean);
        
        charts.push({
          title,
          items: chartItems
        });
      }
    });

    return charts;
  }

  _parseMoodCategories(data) {
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const categories = [];

    contents.forEach(section => {
      if (section.musicCarouselShelfRenderer) {
        const title = section.musicCarouselShelfRenderer.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text;
        const items = section.musicCarouselShelfRenderer.contents || [];
        const categoryItems = items.map(item => this._parseMusicItem(item.musicTwoRowItemRenderer)).filter(Boolean);
        
        categories.push({
          title,
          items: categoryItems
        });
      }
    });

    return categories;
  }

  _parseMoodPlaylists(data) {
    const contents = data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const playlists = [];

    contents.forEach(section => {
      if (section.musicShelfRenderer) {
        const items = section.musicShelfRenderer.contents || [];
        const playlistItems = items.map(item => this._parseMusicItem(item.musicResponsiveListItemRenderer)).filter(Boolean);
        playlists.push(...playlistItems);
      }
    });

    return playlists;
  }

  _parseWatchPlaylist(data) {
    const contents = data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];
    const tracks = [];

    contents.forEach(item => {
      if (item.playlistPanelVideoRenderer) {
        const video = item.playlistPanelVideoRenderer;
        tracks.push({
          videoId: video.videoId,
          title: video.title?.runs?.[0]?.text,
          author: video.shortBylineText?.runs?.[0]?.text,
          lengthSeconds: video.lengthSeconds,
          thumbnail: video.thumbnail?.thumbnails?.[0]?.url
        });
      }
    });

    return {
      tracks,
      playlistId: data?.watchNextRenderer?.playlistId
    };
  }

  _parseMusicItem(item) {
    if (!item) return null;

    const title = item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
    const subtitle = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
    const thumbnail = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url;
    
    const videoId = item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
    const browseId = item.navigationEndpoint?.browseEndpoint?.browseId;
    const playlistId = item.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_PLAYLIST' 
      ? item.navigationEndpoint?.browseEndpoint?.browseId 
      : null;
    
    // Duration can be in fixedColumns (ideal) or embedded in subtitle runs
    let duration = item.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text;
    if (!duration) {
      // Fallback: scan subtitle runs for a time pattern like 3:24 or 1:02:45
      const subtitleRuns = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      for (const run of subtitleRuns) {
        const text = (run?.text || '').trim();
        if (!text) continue;
        const match = text.match(/\b(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\b/);
        // Also match mm:ss pattern
        const match2 = !match && text.match(/\b(\d{1,2}):(\d{2})\b/);
        if (match) {
          const h = parseInt(match[1] || '0', 10);
          const m = parseInt(match[2] || '0', 10);
          const s = parseInt(match[3] || '0', 10);
          const total = h * 3600 + m * 60 + s;
          duration = h ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}` : `${m}:${s.toString().padStart(2,'0')}`;
          item.__derivedDurationSeconds = total; // cache for reuse below
          break;
        } else if (match2) {
          const m = parseInt(match2[1] || '0', 10);
          const s = parseInt(match2[2] || '0', 10);
          const total = m * 60 + s;
          duration = `${m}:${s.toString().padStart(2,'0')}`;
          item.__derivedDurationSeconds = total;
          break;
        }
      }
    }

    const artists = [];
    let album = null;
    let views = null;
    let year = null;

    subtitle.forEach((run, index) => {
      if (run.navigationEndpoint?.browseEndpoint) {
        const pageType = run.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
        
        if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
          artists.push({
            name: run.text,
            id: run.navigationEndpoint.browseEndpoint.browseId
          });
        } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
          album = {
            name: run.text,
            id: run.navigationEndpoint.browseEndpoint.browseId
          };
        }
      } else if (run.text) {
        const text = run.text.trim();
        if (text.includes('views')) {
          views = text;
        } else if (/^\d{4}$/.test(text)) {
          year = text;
        }
      }
    });

    const isExplicit = item.badges?.some(badge => 
      badge.musicInlineBadgeRenderer?.icon?.iconType === 'MUSIC_EXPLICIT_BADGE'
    ) || false;

    let resultType = 'song';
    let category = 'Songs';
    
    if (playlistId) {
      resultType = 'playlist';
      category = 'Playlists';
    } else if (browseId?.startsWith('UC')) {
      resultType = 'artist';
      category = 'Artists';
    } else if (browseId?.startsWith('MPREb_')) {
      resultType = 'album';
      category = 'Albums';
    }

    const result = {
      category: category,
      resultType: resultType,
      title: title,
      thumbnails: this._parseThumbnails(item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || []),
      isExplicit: isExplicit
    };

    if (videoId) {
      result.videoId = videoId;
      result.duration = duration;
      // Prefer derived seconds if we computed from subtitle text
      const derived = item.__derivedDurationSeconds;
      result.duration_seconds = Number.isInteger(derived) ? derived : this._parseDurationToSeconds(duration);
      result.videoType = 'MUSIC_VIDEO_TYPE_ATV';
    }

    if (artists.length > 0) {
      result.artists = artists;
    }

    if (album) {
      result.album = album;
    }

    if (browseId) {
      result.browseId = browseId;
    }

    if (views) {
      result.views = views;
    }

    if (year) {
      result.year = year;
    }

    return result;
  }

  _parseDurationToSeconds(duration) {
    if (!duration) return null;
    
    const parts = duration.split(':').map(p => parseInt(p));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
      return parts[0];
    }
    return null;
  }

  _parseThumbnails(thumbnails) {
    return thumbnails.map(thumb => ({
      url: thumb.url,
      width: thumb.width,
      height: thumb.height
    }));
  }

  _parseTracksFromContents(contents) {
    const tracks = [];
    
    contents.forEach(section => {
      if (section.musicShelfRenderer) {
        const items = section.musicShelfRenderer.contents || [];
        items.forEach(item => {
          if (item.musicResponsiveListItemRenderer) {
            const track = this._parseMusicItem(item.musicResponsiveListItemRenderer);
            if (track) tracks.push(track);
          }
        });
      }
    });

    return tracks;
  }

  _parseAlbumsFromContents(contents) {
    return this._parseTracksFromContents(contents);
  }

  _parseSinglesFromContents(contents) {
    return this._parseTracksFromContents(contents);
  }
}

module.exports = YTMusic;
