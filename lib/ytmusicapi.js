import axios from 'axios';
import { Innertube } from 'youtubei.js';

class YTMusic {
  constructor() {
    this.baseURL = (process.env.YTM_BASE_URL || 'https://music.youtube.com') + '/youtubei/v1';
    this.apiKey = 'AIzaSyC9XL3ZjWjXClIX1FmUxJq--EohcD4_oSs';
    this.context = {
      client: {
        hl: "en",
        gl: "IN",
        remoteHost: "2409:40e3:5046:edc0:9109:7731:5a8c:9727",
        deviceMake: "Apple",
        deviceModel: "",
        visitorData: "CgtBeG1UR2Q1VVNSNCjRjuLHBjIKCgJJThIEGgAgSA%3D%3D",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
        clientName: "WEB_REMIX",
        clientVersion: "1.20251015.03.00",
        osName: "Macintosh",
        osVersion: "10_15_7",
        originalUrl: "https://music.youtube.com/",
        platform: "DESKTOP",
        clientFormFactor: "UNKNOWN_FORM_FACTOR",
        configInfo: {
          appInstallData: "CNGO4scGEN68zhwQ8J3PHBCstYATEPOQ0BwQmY2xBRCK688cEJbbzxwQ3unPHBCL988cEPLozxwQ2vfOHBC52c4cEIHNzhwQ4riwBRDxnLAFENqF0BwQrtbPHBCByM8cEJTyzxwQhJHQHBC35M8cEJWxgBMQ4Y7QHBDJ968FEJOD0BwQ4OnPHBCBlNAcELjkzhwQndCwBRD8ss4cEJmYsQUQ8ZfQHBCc188cEOK4zxwQm4jQHBC1tYATEMj3zxwQvoqwBRCakdAcELj2zxwQvZmwBRDnldAcEJT-sAUQu9nOHBD7_88cEL22rgUQ9quwBRDZitAcEM-N0BwQiIewBRDM364FEIeszhwQ4pfQHBC36v4SEImwzhwQjOnPHBDFw88cEMGP0BwQzOvPHBDRsYATEJX3zxwQ54vQHBDT4a8FELOF0BwqQENBTVNLaFVoLVpxLURMaVVFcXJlOEFzeXYxX3AxUVVEemY4Rm9ZQUdvaTZrWW9veG0wZnFKX1lQN3pBZEJ3PT0wAA%3D%3D",
          coldConfigData: "CNGO4scGGjJBT2pGb3gwenZtV3ItSFpyZE1USmUzYl9aOE82TzR4R2kxUnVNMkl5U1pnQWx1eXFqdyIyQU9qRm94MFQzV0k1NnRESDNTOTBKbWJ5d2d2azJOZ2l0R0N2UEJOSGQyRWxOQ0kzc1E%3D",
          coldHashData: "CNGO4scGEhM4MzcyMjg4Nzg1MDY2MDg0NzkyGNGO4scGMjJBT2pGb3gwenZtV3ItSFpyZE1USmUzYl9aOE82TzR4R2kxUnVNMkl5U1pnQWx1eXFqdzoyQU9qRm94MFQzV0k1NnRESDNTOTBKbWJ5d2d2azJOZ2l0R0N2UEJOSGQyRWxOQ0kzc1E%3D",
          hotHashData: "CNGO4scGEhM1ODU5MjE3MDk3MDg1MDcwNjY1GNGO4scGMjJBT2pGb3gwenZtV3ItSFpyZE1USmUzYl9aOE82TzR4R2kxUnVNMkl5U1pnQWx1eXFqdzoyQU9qRm94MFQzV0k1NnRESDNTOTBKbWJ5d2d2azJOZ2l0R0N2UEJOSGQyRWxOQ0kzc1E%3D"
        },
        userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
        timeZone: "Asia/Calcutta",
        browserName: "Chrome",
        browserVersion: "141.0.0.0",
        acceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        deviceExperimentId: "ChxOelUyTXprME5ETTFOak0wTnpNMU5qVTVPUT09ENGO4scGGNGO4scG",
        rolloutToken: "CPuZ8dGXgZ2sMRDRwvuAtsGNAxjTvY21nreQAw%3D%3D",
        screenWidthPoints: 1365,
        screenHeightPoints: 898,
        screenPixelDensity: 1,
        screenDensityFloat: 1,
        utcOffsetMinutes: 330,
        musicAppInfo: {
          pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_CAN_BE_INSTALLED",
          webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
          storeDigitalGoodsApiSupportStatus: {
            playStoreDigitalGoodsApiSupportStatus: "DIGITAL_GOODS_API_SUPPORT_STATUS_UNSUPPORTED"
          }
        }
      },
      user: {
        lockedSafetyMode: false
      },
      request: {
        useSsl: true,
        internalExperimentFlags: [],
        consistencyTokenJars: [{
          encryptedTokenJarContents: "AKreu9svOUOLJMQD_tFj2omSdIcXrtYKN929kBWF15DG0KOHW5Rm2EXCH46H-G1MU7Kx2YNY3E9jQNz-f0IXTyDkYJsbB_6zdMKEd1zfX7bj3HepPxf4qbE-DNJmP-ZASMogU95zSKoJOfztaZwv741X",
          expirationSeconds: "600"
        }]
      },
      clickTracking: {
        clickTrackingParams: "CA0Q_V0YAiITCNWl2oGkt5ADFZyp2AUdCVA4U8oBBAyZbdg="
      },
      adSignalsInfo: {
        params: [
          { key: "dt", value: "1761118033710" },
          { key: "flash", value: "0" }
        ]
      }
    };
    this.visitorData = null; // Will be captured from first response
    this.innertube = null;
  }

  async initialize() {
    try {
      this.innertube = await Innertube.create({
        generate_session_locally: true
      });
      console.log('YouTube.js Innertube initialized');
    } catch (error) {
      console.error('Failed to initialize Innertube:', error);
    }
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
      if (!this.innertube) await this.initialize();
      console.log(`DEBUG: Fetching album ${browseId}`);

      let album;
      try {
        album = await this.innertube.music.getAlbum(browseId);
      } catch (e) {
        if (e.message.includes('Invalid album id')) {
          console.log('DEBUG: Invalid album id, trying as playlist');
          // Fallback to getPlaylist for OLAK... IDs
          const playlist = await this.getPlaylist(browseId);
          // Adapt playlist result to album format
          return {
            ...playlist,
            artist: playlist.author, // Map author to artist
            tracks: playlist.tracks // Tracks are already compatible
          };
        }
        throw e;
      }

      // Map to expected format
      return {
        title: album.title,
        artist: album.artists?.[0]?.name || '',
        thumbnail: album.thumbnails?.[0]?.url || '',
        tracks: album.contents.map(track => ({
          videoId: track.id,
          title: track.title,
          artists: track.artists,
          album: track.album,
          duration: track.duration?.text || '',
          duration_seconds: track.duration?.seconds || 0,
          isExplicit: track.is_explicit,
          thumbnails: track.thumbnails
        }))
      };
    } catch (error) {
      console.error('Innertube getAlbum error:', error);
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
      if (!this.innertube) await this.initialize();
      console.log(`DEBUG: Fetching playlist ${playlistId}`);
      const playlist = await this.innertube.music.getPlaylist(playlistId);

      console.log('DEBUG: Playlist keys:', Object.keys(playlist));
      console.log('DEBUG: Playlist title:', playlist.title);
      console.log('DEBUG: Playlist header:', playlist.header ? Object.keys(playlist.header) : 'none');

      if (!playlist.items || playlist.items.length === 0) {
        console.log('DEBUG: Playlist contents structure:', JSON.stringify(playlist.contents, null, 2));
      }

      // Map to expected format
      return {
        title: playlist.title || playlist.header?.title?.text || '',
        author: playlist.author?.name || playlist.header?.subtitle?.text || '',
        thumbnail: playlist.thumbnails?.[0]?.url || playlist.background?.thumbnails?.[0]?.url || '',
        tracks: (playlist.items || []).map(track => ({
          videoId: track.id,
          title: track.title,
          artists: track.artists,
          album: track.album,
          duration: track.duration?.text || '',
          duration_seconds: track.duration?.seconds || 0,
          isExplicit: track.is_explicit,
          thumbnails: track.thumbnails
        }))
      };
    } catch (error) {
      console.error('Innertube getPlaylist error:', error);
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
        'authority': 'music.youtube.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': 'SAPISIDHASH 1761118060_95f582aefd50f3cb9b83b6ac4d2e064fda0d0bc9_u SAPISID1PHASH 1761118060_95f582aefd50f3cb9b83b6ac4d2e064fda0d0bc9_u SAPISID3PHASH 1761118060_95f582aefd50f3cb9b83b6ac4d2e064fda0d0bc9_u',
        'content-length': JSON.stringify(requestBody).length.toString(),
        'content-type': 'application/json',
        'cookie': 'VISITOR_INFO1_LIVE=AxmTGd5USR4; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgSA%3D%3D; LOGIN_INFO=AFmmF2swRgIhAI2xPU2ezdY59rfPAXZLOumYQaWqd0pANclFDF2Yv-ZZAiEAkyhyr873DSFCTHacatdP2MjyDnrPGXDQmoweBgi3fkI:QUQ3MjNmeUltUTd1MU0tQ3hxbTVvbkprVEJpdWpyUFBVT21NRmZrWTVPeUh5UFdXZEcyVDA2dDY0N0ZZSFFLVnkzN1gxRlY2eGtFUFh1N3l1SkY2UWgxNjBKcXFuZ2ZlYVVWdG5mM2dTc1U0ZlljNklabS1ZZVFHb1pvR2pKcUFVZm1adEwxNkNBNFN5TjhIRUlaVGtiMENlYUVISFpzY1Zn; PREF=f6=40000000&tz=Asia.Calcutta&f7=100&f5=30000&repeat=NONE&autoplay=true; HSID=AkLkCNgRQ354eNK6u; SSID=AN86t_h5ETVFaUpph; APISID=9fO8tVZyXmogvaIN/Ah29fTZriC3JNNhGm; SAPISID=tSiCTfhj2kaA_0cW/ARpliqKQ8v6tBxz5-; __Secure-1PAPISID=tSiCTfhj2kaA_0cW/ARpliqKQ8v6tBxz5-; __Secure-3PAPISID=tSiCTfhj2kaA_0cW/ARpliqKQ8v6tBxz5-; _gcl_au=1.1.309097785.1758604231; __Secure-1PSIDTS=sidts-CjUBmkD5S0fnz9S042gY8xKZzAMYC76l1zZHShSE7MpTSYlkL0_oY7xeSPGvCmyvAPgYq1CPPxAA; __Secure-3PSIDTS=sidts-CjUBmkD5S0fnz9S042gY8xKZzAMYC76l1zZHShSE7MpTSYlkL0_oY7xeSPGvCmyvAPgYq1CPPxAA; YSC=7fT-z4opUKA; __Secure-ROLLOUT_TOKEN=CPuZ8dGXgZ2sMRDRwvuAtsGNAxjTvY21nreQAw%3D%3D; SID=g.a0002gj5XwU_36QHH0x-TSbZE0-SlNOFM7wGzpKhG8k0hWKRWIzKdO41QbuRfYD41a6K5J6FdAACgYKAfISARMSFQHGX2MiMpbwpfAc99obqjqyxMMhnhoVAUF8yKqKSE4sWUn0D5ok_s0XXpYr0076; __Secure-1PSID=g.a0002gj5XwU_36QHH0x-TSbZE0-SlNOFM7wGzpKhG8k0hWKRWIzKWzH47A1Zy9dmhpMv5wB3zAACgYKAZQSARMSFQHGX2MibtEOqADIe8Y64lc4uXpEiRoVAUF8yKoSpkH-g54jqy-AFcA915Q50076; __Secure-3PSID=g.a0002gj5XwU_36QHH0x-TSbZE0-SlNOFM7wGzpKhG8k0hWKRWIzKB334A7IuwfNqZ4isEgIhFgACgYKAb0SARMSFQHGX2Mie__LY3XvFf56bxTndyMNUxoVAUF8yKo-KtwZXAeYQmWxWvh_STtI0076; CONSISTENCY=AKreu9svOUOLJMQD_tFj2omSdIcXrtYKN929kBWF15DG0KOHW5Rm2EXCH46H-G1MU7Kx2YNY3E9jQNz-f0IXTyDkYJsbB_6zdMKEd1zfX7bj3HepPxf4qbE-DNJmP-ZASMogU95zSKoJOfztaZwv741X; SIDCC=AKEyXzVPt3boLUZ1SH41QYBWv_U0I2UPldR2Ykhe5ifHGq4HdQvZsdadaulfzFzO8E7M6h2lqg; __Secure-1PSIDCC=AKEyXzUujXB9sya0I3fRQrUmxnxKBHyuIzy1Gv_C13XlDOC6ocIpz6T99io2Cm4ZROEga3FHKps; __Secure-3PSIDCC=AKEyXzXd7s-eX-G-ffl2-AJ1sgeLw2nNcQfCr1_rSygSquvgJ3moVCMRZdv-kKlJdm3xgRPnRSQ',
        'origin': 'https://music.youtube.com',
        'priority': 'u=1, i',
        'referer': 'https://music.youtube.com/search?q=shubh',
        'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-form-factors': '"Desktop"',
        'sec-ch-ua-full-version': '"141.0.7390.108"',
        'sec-ch-ua-full-version-list': '"Google Chrome";v="141.0.7390.108", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.108"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua-platform-version': '"15.6.1"',
        'sec-ch-ua-wow64': '?0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'same-origin',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'x-browser-channel': 'stable',
        'x-browser-copyright': 'Copyright 2025 Google LLC. All rights reserved.',
        'x-browser-validation': 'qSH0RgPhYS+tEktJTy2ahvLDO9s=',
        'x-browser-year': '2025',
        'x-client-data': 'CI62yQEIprbJAQipncoBCPqQywEIk6HLAQiGoM0BCOnkzgEIuv3OAQjLi88BCI6OzwEIsZHPAQj7ks8BGLKGzwEYmIjPAQ==',
        'x-goog-authuser': '0',
        'x-goog-visitor-id': 'CgtBeG1UR2Q1VVNSNCjRjuLHBjIKCgJJThIEGgAgSA%3D%3D',
        'x-origin': 'https://music.youtube.com',
        'x-youtube-bootstrap-logged-in': 'true',
        'x-youtube-client-name': '67',
        'x-youtube-client-version': '1.20251015.03.00'
      }
    });

    // Capture stable visitorData from first successful call
    try {
      const vd = response?.data?.responseContext?.visitorData;
      if (vd && !this.visitorData) this.visitorData = vd;
    } catch { }

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
      'artists': 'EgWKAQIgAWoKEAMQBBAJEAoQBQ%3D%3D', // Updated to correct artist filter
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
          duration = h ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
          item.__derivedDurationSeconds = total; // cache for reuse below
          break;
        } else if (match2) {
          const m = parseInt(match2[1] || '0', 10);
          const s = parseInt(match2[2] || '0', 10);
          const total = m * 60 + s;
          duration = `${m}:${s.toString().padStart(2, '0')}`;
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

export default YTMusic;
