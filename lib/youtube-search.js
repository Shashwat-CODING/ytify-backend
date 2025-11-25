import axios from 'axios';

class YouTubeSearch {
  constructor() {
    this.baseURL = 'https://www.youtube.com';
    this.searchURL = 'https://www.youtube.com/results';
    this.continuationURL = 'https://www.youtube.com/youtubei/v1/search';
    this.suggestionsURL = 'https://suggestqueries-clients6.youtube.com/complete/search';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    this.apiKey = null; // Will be extracted from initial page
    this.clientVersion = null;
  }

  /**
   * Extract API key and client version from initial page load
   */
  async _extractAPIConfig(html) {
    try {
      const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      const clientVersionMatch = html.match(/"clientVersion":"([^"]+)"/);

      if (apiKeyMatch) this.apiKey = apiKeyMatch[1];
      if (clientVersionMatch) this.clientVersion = clientVersionMatch[1];
    } catch (error) {
      console.error('Error extracting API config:', error);
    }
  }

  /**
   * Make a continuation request using POST
   */
  async _fetchContinuation(continuationToken) {
    try {
      if (!this.apiKey) {
        throw new Error('API key not initialized. Make an initial search first.');
      }

      const response = await axios.post(
        `${this.continuationURL}?key=${this.apiKey}`,
        {
          continuation: continuationToken,
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: this.clientVersion || '2.20231219.01.00'
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.headers['User-Agent'],
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Continuation request failed: ${error.message}`);
    }
  }

  /**
   * Search for videos on YouTube
   * @param {string} query - Search query
   * @param {string} continuationToken - Continuation token for pagination
   * @returns {Promise<Object>} Search results with continuation token
   */
  async searchVideos(query, continuationToken = null) {
    try {
      if (continuationToken) {
        // Use POST request for continuation
        const data = await this._fetchContinuation(continuationToken);
        return this._parseContinuationResults(data, 'video');
      }

      // FIXED: Require query for initial search
      if (!query) {
        throw new Error('Query is required for initial search');
      }

      // Initial search with GET request
      const response = await axios.get(this.searchURL, {
        params: {
          search_query: query,
          sp: 'EgIQAQ%253D%253D'
        },
        headers: this.headers
      });

      // Extract API config for continuation requests
      await this._extractAPIConfig(response.data);
      return this._parseVideoResults(response.data);
    } catch (error) {
      throw new Error(`Video search failed: ${error.message}`);
    }
  }

  /**
   * Search for channels on YouTube
   * @param {string} query - Search query
   * @param {string} continuationToken - Continuation token for pagination
   * @returns {Promise<Object>} Search results with continuation token
   */
  async searchChannels(query, continuationToken = null) {
    try {
      if (continuationToken) {
        const data = await this._fetchContinuation(continuationToken);
        return this._parseContinuationResults(data, 'channel');
      }

      // FIXED: Require query for initial search
      if (!query) {
        throw new Error('Query is required for initial search');
      }

      const response = await axios.get(this.searchURL, {
        params: {
          search_query: query,
          sp: 'EgIQAg%253D%253D'
        },
        headers: this.headers
      });

      await this._extractAPIConfig(response.data);
      return this._parseChannelResults(response.data);
    } catch (error) {
      throw new Error(`Channel search failed: ${error.message}`);
    }
  }

  /**
   * Search for playlists on YouTube
   * @param {string} query - Search query
   * @param {string} continuationToken - Continuation token for pagination
   * @returns {Promise<Object>} Search results with continuation token
   */
  async searchPlaylists(query, continuationToken = null) {
    try {
      if (continuationToken) {
        const data = await this._fetchContinuation(continuationToken);
        return this._parseContinuationResults(data, 'playlist');
      }

      // FIXED: Require query for initial search
      if (!query) {
        throw new Error('Query is required for initial search');
      }

      const response = await axios.get(this.searchURL, {
        params: {
          search_query: query,
          sp: 'EgIQAw%253D%253D'
        },
        headers: this.headers
      });

      await this._extractAPIConfig(response.data);
      return this._parsePlaylistResults(response.data);
    } catch (error) {
      throw new Error(`Playlist search failed: ${error.message}`);
    }
  }

  /**
   * Parse continuation response data
   */
  _parseContinuationResults(data, type) {
    const results = [];
    let nextContinuationToken = null;

    try {
      const actions = data?.onResponseReceivedCommands || data?.onResponseReceivedActions || [];

      for (const action of actions) {
        const items = action?.appendContinuationItemsAction?.continuationItems || [];

        const pushByType = (node) => {
          if (!node) return;
          if (type === 'video' && node.videoRenderer) {
            const v = this._parseVideoRenderer(node.videoRenderer);
            if (v) results.push(v);
          } else if (type === 'channel' && node.channelRenderer) {
            const c = this._parseChannelRenderer(node.channelRenderer);
            if (c) results.push(c);
          } else if (type === 'playlist' && node.playlistRenderer) {
            const p = this._parsePlaylistRenderer(node.playlistRenderer);
            if (p) results.push(p);
          } else if (node.richItemRenderer?.content) {
            // richItemRenderer wrapper
            pushByType(node.richItemRenderer.content);
          } else if (node.itemSectionRenderer?.contents) {
            // sometimes continuationItems embed an itemSectionRenderer again
            for (const inner of node.itemSectionRenderer.contents) {
              pushByType(inner);
            }
          }
        };

        for (const item of items) {
          if (item.continuationItemRenderer) {
            nextContinuationToken = item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
            continue;
          }
          pushByType(item);
        }
      }
    } catch (error) {
      console.error('Error parsing continuation results:', error);
    }

    return { results, continuationToken: nextContinuationToken };
  }

  /**
   * Get search suggestions from YouTube
   * @param {string} query - Partial query
   * @returns {Promise<Array>} Search suggestions
   */
  async getSuggestions(query) {
    try {
      const response = await axios.get(this.suggestionsURL, {
        params: {
          ds: 'yt',
          hl: 'en',
          gl: 'IN',
          client: 'youtube',
          gs_ri: 'youtube',
          q: query,
          cp: String(query.length)
        },
        headers: this.headers
      });

      return this._parseSuggestions(response.data);
    } catch (error) {
      return this._getStaticSuggestions(query);
    }
  }

  /**
   * Get channel information by channel ID
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} Channel information
   */
  async getChannelInfo(channelId) {
    try {
      const response = await axios.get(`${this.baseURL}/channel/${channelId}`, {
        headers: this.headers
      });

      return this._parseChannelInfo(response.data);
    } catch (error) {
      throw new Error(`Channel info failed: ${error.message}`);
    }
  }

  // Private helper methods
  _parseVideoResults(html) {
    const results = [];
    let nextContinuationToken = null;

    try {
      const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
      if (!jsonMatch) {
        return { results, continuationToken: nextContinuationToken };
      }

      const data = JSON.parse(jsonMatch[1]);
      const primary = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents;
      const sections = primary?.sectionListRenderer?.contents || [];
      const items = sections[0]?.itemSectionRenderer?.contents || [];

      for (const item of items) {
        if (item.videoRenderer) {
          const v = this._parseVideoRenderer(item.videoRenderer);
          if (v) results.push(v);
        } else if (item.richItemRenderer?.content?.videoRenderer) {
          const v = this._parseVideoRenderer(item.richItemRenderer.content.videoRenderer);
          if (v) results.push(v);
        }
      }

      nextContinuationToken = this._extractContinuationToken(data);
    } catch (error) {
      console.error('Error parsing video results:', error);
    }

    return { results, continuationToken: nextContinuationToken };
  }

  _parseChannelResults(html) {
    const results = [];
    let nextContinuationToken = null;

    try {
      const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
      if (!jsonMatch) {
        return { results, continuationToken: nextContinuationToken };
      }

      const data = JSON.parse(jsonMatch[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (item.channelRenderer) {
            const channel = this._parseChannelRenderer(item.channelRenderer);
            if (channel) results.push(channel);
          }
        }
      }

      nextContinuationToken = this._extractContinuationToken(data);
    } catch (error) {
      console.error('Error parsing channel results:', error);
    }

    return { results, continuationToken: nextContinuationToken };
  }

  _parsePlaylistResults(html) {
    const results = [];
    let nextContinuationToken = null;

    try {
      const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
      if (!jsonMatch) {
        return { results, continuationToken: nextContinuationToken };
      }

      const data = JSON.parse(jsonMatch[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      for (const section of contents) {
        const items = section?.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (item.playlistRenderer) {
            const playlist = this._parsePlaylistRenderer(item.playlistRenderer);
            if (playlist) results.push(playlist);
          }
        }
      }

      nextContinuationToken = this._extractContinuationToken(data);
    } catch (error) {
      console.error('Error parsing playlist results:', error);
    }

    return { results, continuationToken: nextContinuationToken };
  }

  _extractContinuationToken(data) {
    try {
      const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      for (const section of sections) {
        if (section.continuationItemRenderer) {
          return section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
        }

        const items = section?.itemSectionRenderer?.contents || [];
        for (const it of items) {
          if (it.continuationItemRenderer) {
            return it.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token || null;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting continuation token:', error);
    }

    return null;
  }

  _parseVideoRenderer(videoRenderer) {
    const videoId = videoRenderer.videoId;
    const titleRun = videoRenderer.title?.runs?.[0];
    const title = titleRun?.text;
    const accessibilityTitle = videoRenderer.title?.accessibility?.accessibilityData?.label || title || null;
    const accessibilityDuration = videoRenderer.lengthText?.accessibility?.accessibilityData?.label || null;
    const duration = videoRenderer.lengthText?.simpleText || null;
    const ownerRun = videoRenderer.ownerText?.runs?.[0];
    const channelId = ownerRun?.navigationEndpoint?.browseEndpoint?.browseId || null;
    const channelName = ownerRun?.text || null;
    const channelLink = channelId ? `https://www.youtube.com/channel/${channelId}` : null;
    const channelThumbs = videoRenderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails || [];
    const channelThumbnails = channelThumbs.map(t => ({ url: t.url, width: t.width, height: t.height }));
    const descRuns = videoRenderer.descriptionSnippet?.runs || [];
    const descriptionSnippet = descRuns.map(r => ({ text: r.text, bold: !!r.bold }));
    const thumbs = videoRenderer.thumbnail?.thumbnails || [];
    const thumbnails = thumbs.map(t => ({ url: t.url, width: t.width, height: t.height }));
    const richThumbList = videoRenderer.richThumbnail?.movingThumbnailRenderer?.movingThumbnailDetails?.thumbnails
      || videoRenderer.richThumbnail?.movingThumbnailRenderer?.thumbnail?.thumbnails
      || [];
    const richThumb = richThumbList.length ? richThumbList[0] : null;
    const richThumbnail = richThumb ? { url: richThumb.url, width: richThumb.width, height: richThumb.height } : null;
    const publishedTime = videoRenderer.publishedTimeText?.simpleText || null;
    const fullViewText = videoRenderer.viewCountText?.simpleText || null;
    const shortViewText = videoRenderer.shortViewCountText?.simpleText || null;
    const viewCount = (fullViewText || shortViewText)
      ? { text: fullViewText || shortViewText, short: shortViewText || fullViewText }
      : null;

    return {
      accessibility: {
        duration: accessibilityDuration,
        title: accessibilityTitle
      },
      channel: {
        id: channelId,
        link: channelLink,
        name: channelName,
        thumbnails: channelThumbnails
      },
      descriptionSnippet,
      duration,
      id: videoId,
      link: `https://www.youtube.com/watch?v=${videoId}`,
      publishedTime,
      richThumbnail,
      shelfTitle: null,
      thumbnails,
      title,
      type: 'video',
      viewCount
    };
  }

  _parseChannelRenderer(channelRenderer) {
    const title = channelRenderer.title?.simpleText;
    const channelId = channelRenderer.channelId;
    const thumbnail = channelRenderer.thumbnail?.thumbnails?.[0]?.url;
    const subscriberCount = channelRenderer.subscriberCountText?.simpleText;
    const videoCount = channelRenderer.videoCountText?.simpleText;
    const description = channelRenderer.descriptionSnippet?.runs?.[0]?.text;

    return {
      type: 'channel',
      channelId,
      title,
      thumbnail,
      subscriberCount,
      videoCount,
      description,
      url: `https://www.youtube.com/channel/${channelId}`
    };
  }

  _parsePlaylistRenderer(playlistRenderer) {
    const title = playlistRenderer.title?.simpleText;
    const playlistId = playlistRenderer.playlistId;
    const thumbnail = playlistRenderer.thumbnails?.[0]?.thumbnails?.[0]?.url;
    const videoCount = playlistRenderer.videoCount;
    const author = playlistRenderer.shortBylineText?.runs?.[0]?.text;
    const authorChannelId = playlistRenderer.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;

    return {
      type: 'playlist',
      playlistId,
      title,
      thumbnail,
      videoCount,
      author,
      authorChannelId,
      url: `https://www.youtube.com/playlist?list=${playlistId}`
    };
  }

  _parseSuggestions(data) {
    try {
      let jsonData = data;
      // Handle JSONP: window.google.ac.h([...]) / window.google.ac.s([...])
      if (typeof data === 'string' && data.includes('window.google.ac.')) {
        const start = data.indexOf('(');
        const end = data.lastIndexOf(')');
        if (start !== -1 && end !== -1 && end > start) {
          jsonData = data.slice(start + 1, end);
        }
      }

      const parsed = JSON.parse(jsonData);
      const suggestions = [];

      if (parsed[1] && Array.isArray(parsed[1])) {
        parsed[1].forEach(item => {
          if (Array.isArray(item) && item[0]) {
            suggestions.push(item[0]);
          } else if (typeof item === 'string') {
            suggestions.push(item);
          }
        });
      }

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Error parsing suggestions:', error);
      return this._getStaticSuggestions('');
    }
  }

  _parseChannelInfo(html) {
    try {
      const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
      if (!jsonMatch) {
        throw new Error('Could not parse channel data');
      }

      const data = JSON.parse(jsonMatch[1]);
      const header = data?.header?.c4TabbedHeaderRenderer;

      if (!header) {
        throw new Error('Channel header not found');
      }

      return {
        title: header.title,
        channelId: header.channelId,
        thumbnail: header.avatar?.thumbnails?.[0]?.url,
        subscriberCount: header.subscriberCountText?.simpleText,
        videoCount: header.videosCountText?.runs?.[0]?.text,
        description: header.description?.simpleText
      };
    } catch (error) {
      throw new Error(`Channel info parsing failed: ${error.message}`);
    }
  }

  _getStaticSuggestions(query) {
    const queryLower = query.toLowerCase();
    const suggestionsMap = {
      'music': ['music', 'music video', 'music song', 'music 2024', 'music playlist'],
      'video': ['video', 'video song', 'video 2024', 'video download', 'video editing'],
      'movie': ['movie', 'movie trailer', 'movie song', 'movie review', 'movie 2024'],
      'song': ['song', 'song 2024', 'song download', 'song lyrics', 'song video'],
      'dance': ['dance', 'dance video', 'dance song', 'dance tutorial', 'dance 2024'],
      'comedy': ['comedy', 'comedy video', 'comedy show', 'comedy movie', 'comedy 2024'],
      'tutorial': ['tutorial', 'tutorial video', 'tutorial 2024', 'tutorial hindi', 'tutorial english'],
      'news': ['news', 'news today', 'news 2024', 'news hindi', 'news english'],
      'cooking': ['cooking', 'cooking video', 'cooking recipe', 'cooking tutorial', 'cooking 2024'],
      'fitness': ['fitness', 'fitness video', 'fitness workout', 'fitness tips', 'fitness 2024']
    };

    if (suggestionsMap[queryLower]) {
      return suggestionsMap[queryLower];
    }

    for (const [key, suggestions] of Object.entries(suggestionsMap)) {
      if (key.includes(queryLower) || queryLower.includes(key)) {
        return suggestions;
      }
    }

    return [query, `${query} video`, `${query} 2024`, `${query} tutorial`, `${query} song`];
  }
}

export default YouTubeSearch;
