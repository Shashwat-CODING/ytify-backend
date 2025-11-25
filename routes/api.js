const express = require('express');

const router = express.Router();
const { getSimilarTracks, LASTFM_API_KEY } = require('../lib/lastfm_api');
const { getYouTubeSong } = require('../lib/get_youtube_song');
const axios = require('axios');

const ALLOWED_FILTERS = new Set([
  'songs',
  'videos',
  'albums',
  'artists',
  'playlists',
  'profiles',
  'podcasts',
  'episodes',
  'community_playlists'
]);

// Minimal in-memory demo: maps session tokens to subscribed channel IDs.
// Example: sessionToChannelIds.set('demo', new Set(['UC-Example']));
const sessionToChannelIds = new Map();

// YouTube.js removed - using direct Browse API instead

// mapVideoToStreamItem removed - using parseVideoFromBrowse instead

async function fetchChannelItems(channelId, perChannelLimit) {
  // Use YouTube Browse API instead of YouTube.js or RSS
  return await fetchChannelItemsBrowse(channelId, perChannelLimit);
}

// httpsGet removed - using axios instead

async function fetchChannelItemsBrowse(channelId, perChannelLimit) {
  try {
    console.log(`[BROWSE] Fetching channel ${channelId} with limit ${perChannelLimit}`);

    // YouTube Browse API endpoint
    const url = 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false';

    // Request payload for channel videos - using realistic context
    const payload = {
      browseId: channelId,
      context: {
        client: {
          hl: "en",
          gl: "IN",
          remoteHost: "2a09:bac5:3b43:1aaa:0:0:2a8:78",
          deviceMake: "Apple",
          deviceModel: "",
          visitorData: "Cgtkc19JRmZ1RXdvNCiWj7fHBjIKCgJJThIEGgAgPQ%3D%3D",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
          clientName: "WEB",
          clientVersion: "2.20251013.01.00",
          osName: "Macintosh",
          osVersion: "10_15_7",
          originalUrl: `https://www.youtube.com/channel/${channelId}/videos`,
          platform: "DESKTOP",
          clientFormFactor: "UNKNOWN_FORM_FACTOR",
          configInfo: {
            appInstallData: "CJaPt8cGEODpzxwQ-ofQHBCHrM4cEPnQzxwQ3rzOHBDaitAcEMj3zxwQlIPQHBDhjNAcEJWxgBMQ9quwBRDYjdAcEMvRsQUQzo3QHBDa984cEMT0zxwQmejOHBCYuc8cELj2zxwQ18GxBRCzkM8cELargBMQzN-uBRCIh7AFEN7pzxwQ0-GvBRCW288cEKaasAUQieiuBRDRsYATEJGM_xIQgffPHBD7tM8cENmF0BwQ_LLOHBC9irAFEMXDzxwQlP6wBRCNzLAFELvZzhwQgpTQHBDni9AcENaN0BwQuOTOHBCc188cEPLozxwQ4tSuBRC-poATEJX3zxwQq_jOHBDJ968FEK7WzxwQjOnPHBCZjbEFEJ3QsAUQ4M2xBRD3qoATEJuI0BwQudnOHBC9tq4FEIv3zxwQt-TPHBDEgtAcEIKPzxwQre_PHBCZmLEFEJTyzxwQt-r-EhDN0bEFEIHNzhwQmsrPHBCvhs8cEImwzhwQ54_QHBD6_88cEL2ZsAUQ2tHPHBDrgdAcEPXbzxwQqbKAExCKgtAcKkhDQU1TTVJVcS1acS1ETWVVRXYwRXY5VG1DOFBzRkxYTUJvZE1NcUNzQkFQTl93V1FVLUUyeWkya1l1TTNyZ0tjUi1vbkhRYz0wAA%3D%3D"
          },
          userInterfaceTheme: "USER_INTERFACE_THEME_DARK",
          timeZone: "Asia/Calcutta",
          browserName: "Chrome",
          browserVersion: "141.0.0.0",
          memoryTotalKbytes: "8000000",
          acceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
        }
      }
    };

    console.log(`[BROWSE] Making request to YouTube API for channel ${channelId}`);
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Origin': 'https://www.youtube.com',
        'Referer': `https://www.youtube.com/channel/${channelId}/videos`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'same-origin',
        'Sec-Fetch-Site': 'same-origin',
        'X-Origin': 'https://www.youtube.com',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20251013.01.00'
      }
    });

    console.log(`[BROWSE] YouTube API response status: ${response.status} for channel ${channelId}`);

    const data = response.data;
    const items = [];

    console.log(`[BROWSE] Response data keys for channel ${channelId}:`, Object.keys(data || {}));

    // Extract channel name from the response
    let channelName = '';
    if (data?.header?.c4TabbedHeaderRenderer?.title) {
      channelName = data.header.c4TabbedHeaderRenderer.title;
    } else if (data?.metadata?.channelMetadataRenderer?.title) {
      channelName = data.metadata.channelMetadataRenderer.title;
    }

    console.log(`[BROWSE] Channel name extracted: "${channelName}" for channel ${channelId}`);

    // Extract videos from the response - comprehensive approach
    const extractVideos = (contents) => {
      if (!contents) return;

      console.log(`[BROWSE] Processing ${contents.length} content items for channel ${channelId}`);

      for (let i = 0; i < contents.length; i++) {
        const item = contents[i];
        console.log(`[BROWSE] Item ${i} keys:`, Object.keys(item || {}));

        // Handle different video renderer types
        if (item?.richItemRenderer?.content?.videoRenderer) {
          console.log(`[BROWSE] Found richItemRenderer.videoRenderer for channel ${channelId}`);
          const video = item.richItemRenderer.content.videoRenderer;
          items.push(parseVideoFromBrowse(video, channelId, channelName));
        } else if (item?.videoRenderer) {
          console.log(`[BROWSE] Found videoRenderer for channel ${channelId}`);
          items.push(parseVideoFromBrowse(item.videoRenderer, channelId, channelName));
        } else if (item?.gridVideoRenderer) {
          console.log(`[BROWSE] Found gridVideoRenderer for channel ${channelId}`);
          items.push(parseVideoFromBrowse(item.gridVideoRenderer, channelId, channelName));
        } else if (item?.playlistVideoRenderer) {
          console.log(`[BROWSE] Found playlistVideoRenderer for channel ${channelId}`);
          items.push(parseVideoFromBrowse(item.playlistVideoRenderer, channelId, channelName));
        } else if (item?.compactVideoRenderer) {
          console.log(`[BROWSE] Found compactVideoRenderer for channel ${channelId}`);
          items.push(parseVideoFromBrowse(item.compactVideoRenderer, channelId, channelName));
        }

        // Handle nested content
        if (item?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items) {
          console.log(`[BROWSE] Found shelfRenderer with ${item.shelfRenderer.content.expandedShelfContentsRenderer.items.length} items for channel ${channelId}`);
          extractVideos(item.shelfRenderer.content.expandedShelfContentsRenderer.items);
        } else if (item?.shelfRenderer?.content?.horizontalListRenderer?.items) {
          console.log(`[BROWSE] Found shelfRenderer.horizontalListRenderer with ${item.shelfRenderer.content.horizontalListRenderer.items.length} items for channel ${channelId}`);
          extractVideos(item.shelfRenderer.content.horizontalListRenderer.items);
        } else if (item?.horizontalCardListRenderer?.cards) {
          console.log(`[BROWSE] Found horizontalCardListRenderer with ${item.horizontalCardListRenderer.cards.length} items for channel ${channelId}`);
          extractVideos(item.horizontalCardListRenderer.cards);
        } else if (item?.reelShelfRenderer?.content?.horizontalListRenderer?.items) {
          console.log(`[BROWSE] Found reelShelfRenderer with ${item.reelShelfRenderer.content.horizontalListRenderer.items.length} items for channel ${channelId}`);
          extractVideos(item.reelShelfRenderer.content.horizontalListRenderer.items);
        } else if (item?.itemSectionRenderer?.contents) {
          console.log(`[BROWSE] Found itemSectionRenderer with ${item.itemSectionRenderer.contents.length} items for channel ${channelId}`);
          extractVideos(item.itemSectionRenderer.contents);
        } else if (item?.gridRenderer?.items) {
          console.log(`[BROWSE] Found gridRenderer with ${item.gridRenderer.items.length} items for channel ${channelId}`);
          extractVideos(item.gridRenderer.items);
        } else if (item?.horizontalListRenderer?.items) {
          console.log(`[BROWSE] Found horizontalListRenderer with ${item.horizontalListRenderer.items.length} items for channel ${channelId}`);
          extractVideos(item.horizontalListRenderer.items);
        }

        if (perChannelLimit && items.length >= perChannelLimit) break;
      }
    };

    // Try different response structures
    console.log(`[BROWSE] Attempting to extract videos for channel ${channelId}`);

    if (data?.contents?.twoColumnBrowseResultsRenderer?.tabs) {
      console.log(`[BROWSE] Found twoColumnBrowseResultsRenderer with ${data.contents.twoColumnBrowseResultsRenderer.tabs.length} tabs`);
      for (let tabIndex = 0; tabIndex < data.contents.twoColumnBrowseResultsRenderer.tabs.length; tabIndex++) {
        const tab = data.contents.twoColumnBrowseResultsRenderer.tabs[tabIndex];
        console.log(`[BROWSE] Tab ${tabIndex} keys:`, Object.keys(tab || {}));

        if (tab?.tabRenderer?.content?.sectionListRenderer?.contents) {
          console.log(`[BROWSE] Extracting from sectionListRenderer with ${tab.tabRenderer.content.sectionListRenderer.contents.length} items`);
          extractVideos(tab.tabRenderer.content.sectionListRenderer.contents);
        } else if (tab?.tabRenderer?.content?.richGridRenderer?.contents) {
          console.log(`[BROWSE] Extracting from richGridRenderer with ${tab.tabRenderer.content.richGridRenderer.contents.length} items`);
          extractVideos(tab.tabRenderer.content.richGridRenderer.contents);
        } else {
          console.log(`[BROWSE] Tab ${tabIndex} content keys:`, Object.keys(tab?.tabRenderer?.content || {}));
        }
      }
    } else if (data?.contents?.singleColumnBrowseResultsRenderer?.tabs) {
      console.log(`[BROWSE] Found singleColumnBrowseResultsRenderer with ${data.contents.singleColumnBrowseResultsRenderer.tabs.length} tabs`);
      for (const tab of data.contents.singleColumnBrowseResultsRenderer.tabs) {
        if (tab?.tabRenderer?.content?.sectionListRenderer?.contents) {
          console.log(`[BROWSE] Extracting from sectionListRenderer with ${tab.tabRenderer.content.sectionListRenderer.contents.length} items`);
          extractVideos(tab.tabRenderer.content.sectionListRenderer.contents);
        } else if (tab?.tabRenderer?.content?.richGridRenderer?.contents) {
          console.log(`[BROWSE] Extracting from richGridRenderer with ${tab.tabRenderer.content.richGridRenderer.contents.length} items`);
          extractVideos(tab.tabRenderer.content.richGridRenderer.contents);
        }
      }
    } else if (data?.contents?.sectionListRenderer?.contents) {
      console.log(`[BROWSE] Found sectionListRenderer with ${data.contents.sectionListRenderer.contents.length} items`);
      extractVideos(data.contents.sectionListRenderer.contents);
    } else if (data?.contents?.richGridRenderer?.contents) {
      console.log(`[BROWSE] Found richGridRenderer with ${data.contents.richGridRenderer.contents.length} items`);
      extractVideos(data.contents.richGridRenderer.contents);
    } else {
      console.log(`[BROWSE] No known content structure found for channel ${channelId}`);
    }

    console.log(`[BROWSE] Extracted ${items.length} items for channel ${channelId}`);
    return items.slice(0, perChannelLimit || items.length);
  } catch (error) {
    console.error('Browse API error:', error.message);
    return [];
  }
}

function parseVideoFromBrowse(video, channelId, channelName) {
  const id = video?.videoId || '';

  // Extract title - handle different formats
  let title = '';
  if (video?.title?.runs?.[0]?.text) {
    title = video.title.runs[0].text;
  } else if (video?.title?.simpleText) {
    title = video.title.simpleText;
  } else if (video?.title) {
    title = String(video.title);
  }

  // Extract duration - handle different formats
  let duration = 0;

  // Try multiple duration field variations including thumbnailOverlays
  const durationFields = [
    video?.lengthText?.simpleText,
    video?.lengthText?.runs?.[0]?.text,
    video?.lengthSeconds,
    video?.lengthText,
    video?.duration?.simpleText,
    video?.duration?.runs?.[0]?.text,
    video?.duration,
    video?.length?.simpleText,
    video?.length?.runs?.[0]?.text,
    video?.length,
    // Check thumbnailOverlays for duration
    video?.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText,
    video?.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.runs?.[0]?.text,
    video?.thumbnailOverlays?.[1]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText,
    video?.thumbnailOverlays?.[1]?.thumbnailOverlayTimeStatusRenderer?.text?.runs?.[0]?.text
  ];

  for (const field of durationFields) {
    if (field && duration === 0) {
      if (typeof field === 'number') {
        duration = parseInt(field) || 0;
      } else if (typeof field === 'string') {
        const parts = field.split(':').map(p => parseInt(p) || 0);
        if (parts.length === 2) {
          duration = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    }
    if (duration > 0) break;
  }

  // Additional check for thumbnailOverlays if still no duration found
  if (duration === 0 && video?.thumbnailOverlays) {
    for (const overlay of video.thumbnailOverlays) {
      if (overlay?.thumbnailOverlayTimeStatusRenderer?.text) {
        const text = overlay.thumbnailOverlayTimeStatusRenderer.text;
        const durationText = text.simpleText || text.runs?.[0]?.text || '';
        if (durationText) {
          const parts = durationText.split(':').map(p => parseInt(p) || 0);
          if (parts.length === 2) {
            duration = parts[0] * 60 + parts[1];
            break;
          } else if (parts.length === 3) {
            duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
            break;
          }
        }
      }
    }
  }

  // Debug logging for duration parsing
  if (duration === 0) {
    console.log(`[PARSE] Duration parsing failed for video ${id}:`, {
      lengthText: video?.lengthText,
      lengthSeconds: video?.lengthSeconds,
      duration: video?.duration,
      length: video?.length,
      title: title.substring(0, 50) + '...',
      videoKeys: Object.keys(video || {})
    });
  }

  // Extract views - handle different formats
  let views = 0;
  if (video?.viewCountText?.simpleText) {
    const viewText = video.viewCountText.simpleText;
    const match = viewText.match(/([\d,\.]+)([KMB]?)/);
    if (match) {
      let num = parseFloat(match[1].replace(/,/g, ''));
      const suffix = match[2];
      if (suffix === 'K') num *= 1000;
      else if (suffix === 'M') num *= 1000000;
      else if (suffix === 'B') num *= 1000000000;
      views = Math.floor(num);
    }
  } else if (video?.viewCount) {
    views = parseInt(video.viewCount) || 0;
  }

  // Extract published date - handle different formats
  let published = null;
  if (video?.publishedTimeText?.simpleText) {
    // Parse relative time like "2 days ago", "1 week ago", etc.
    const timeText = video.publishedTimeText.simpleText.toLowerCase();
    const now = Date.now();

    if (timeText.includes('hour')) {
      const hours = parseInt(timeText.match(/(\d+)/)?.[1] || '1');
      published = now - (hours * 60 * 60 * 1000);
    } else if (timeText.includes('day')) {
      const days = parseInt(timeText.match(/(\d+)/)?.[1] || '1');
      published = now - (days * 24 * 60 * 60 * 1000);
    } else if (timeText.includes('week')) {
      const weeks = parseInt(timeText.match(/(\d+)/)?.[1] || '1');
      published = now - (weeks * 7 * 24 * 60 * 60 * 1000);
    } else if (timeText.includes('month')) {
      const months = parseInt(timeText.match(/(\d+)/)?.[1] || '1');
      published = now - (months * 30 * 24 * 60 * 60 * 1000);
    } else if (timeText.includes('year')) {
      const years = parseInt(timeText.match(/(\d+)/)?.[1] || '1');
      published = now - (years * 365 * 24 * 60 * 60 * 1000);
    } else {
      published = now - (2 * 24 * 60 * 60 * 1000); // Default to 2 days ago
    }
  } else if (video?.publishedTime) {
    published = parseInt(video.publishedTime) || Date.now();
  }

  const uploaded = published || Date.now();

  // Use channel name from the main response
  const author = channelName || '';

  // Detect if it's a short (duration <= 60 seconds or has shorts indicators)
  const isShort = (duration > 0 && duration <= 60) ||
    video?.isShort === true ||
    video?.isShorts === true ||
    video?.badges?.some?.(badge =>
      badge?.metadataBadgeRenderer?.label?.includes?.('Shorts') ||
      badge?.metadataBadgeRenderer?.label?.includes?.('SHORTS')
    ) ||
    false;

  return {
    id,
    authorId: channelId,
    duration: duration.toString(),
    author,
    views: views.toString(),
    uploaded: uploaded.toString(),
    title,
    isShort
  };
}

// Dynamic instances cache
let instancesCache = null;
let instancesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getDynamicInstances() {
  const now = Date.now();
  if (instancesCache && (now - instancesCacheTime) < CACHE_DURATION) {
    return instancesCache;
  }

  try {
    const response = await axios.get('https://raw.githubusercontent.com/n-ce/Uma/main/dynamic_instances.json', {
      timeout: 10000
    });
    instancesCache = response.data;
    instancesCacheTime = now;
    return instancesCache;
  } catch (error) {
    console.error('Failed to fetch dynamic instances:', error.message);
    // Return fallback instances
    return {
      "piped": ["https://api.piped.private.coffee"],
      "invidious": ["https://invidious.nikkosphere.com", "https://yt.omada.cafe"],
      "jiosaavn": "https://saavn-sigma.vercel.app"
    };
  }
}

async function fetchFromSaavn(title, artist) {
  try {
    // Use saavn.dev for both search and streams
    const searchResp = await axios.get('https://saavn.dev/api/search/songs', {
      params: {
        query: `${title} ${artist}`,
        page: 0,
        limit: 10
      },
      timeout: 10000
    });

    const songs = searchResp.data?.data?.results || [];

    // Normalize helper (remove diacritics, punctuation, spaces, lowercase)
    const normalize = (s) => String(s || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '')
      .toLowerCase();

    const nTitle = normalize(title);
    const nArtist = normalize(artist);

    // Find tolerant match by title and primary artist
    let perfectMatch = songs.find(song => {
      const nName = normalize(song.name);
      const primary = (song.artists?.primary || []).map(a => normalize(a.name));
      const titleOk = nName === nTitle || nName.includes(nTitle) || nTitle.includes(nName);
      const artistOk = primary.includes(nArtist) || primary.some(p => p.includes(nArtist) || nArtist.includes(p));
      return titleOk && artistOk;
    });

    // Fallbacks: match by title only, then by artist only, then first result
    if (!perfectMatch) {
      perfectMatch = songs.find(song => {
        const nName = normalize(song.name);
        return nName === nTitle || nName.includes(nTitle) || nTitle.includes(nName);
      }) || songs.find(song => {
        const primary = (song.artists?.primary || []).map(a => normalize(a.name));
        return primary.includes(nArtist) || primary.some(p => p.includes(nArtist) || nArtist.includes(p));
      }) || songs[0];
    }

    if (!perfectMatch) {
      return {
        service: 'jiosaavn',
        instance: 'https://saavn.dev',
        success: false,
        error: 'No results found'
      };
    }

    // Fetch streams/details from saavn.dev by Saavn song ID
    const detailsResp = await axios.get('https://saavn.dev/api/songs', {
      params: { ids: perfectMatch.id },
      timeout: 10000
    });

    const songData = detailsResp.data?.data?.[0];
    if (!songData) {
      return {
        service: 'jiosaavn',
        instance: 'https://saavn.dev',
        success: false,
        error: 'Song details unavailable'
      };
    }

    // Build streaming URLs from downloadUrl array
    const streamingUrls = (songData.downloadUrl || []).map(d => ({
      url: d.url,
      type: 'download',
      quality: d.quality,
      encrypted: false,
      source: 'saavn.dev'
    }));

    // Choose best quality as primary stream
    const prefOrder = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
    let primaryStreamUrl = null;
    for (const q of prefOrder) {
      const found = (songData.downloadUrl || []).find(d => d.quality === q && d.url);
      if (found) { primaryStreamUrl = found.url; break; }
    }
    if (!primaryStreamUrl && streamingUrls[0]) primaryStreamUrl = streamingUrls[0].url;

    return {
      service: 'jiosaavn',
      instance: 'https://saavn.dev',
      success: true,
      streamUrl: primaryStreamUrl,
      streamingUrls,
      saavnDev: detailsResp.data,
      metadata: {
        id: songData.id,
        title: songData.name,
        album: songData.album?.name || '',
        year: songData.year || '',
        duration: songData.duration || 0,
        image: songData.image?.[1]?.url || songData.image?.[0]?.url || '',
        language: songData.language || '',
        play_count: songData.playCount || 0,
        explicit_content: songData.explicitContent || false,
        album_id: songData.album?.id || '',
        label: songData.label || '',
        album_url: songData.album?.url || '',
        perma_url: songData.url || '',
        has_lyrics: songData.hasLyrics || false,
        release_date: songData.releaseDate || null,
        artists: songData.artists || {}
      }
    };
  } catch (error) {
    return {
      service: 'jiosaavn',
      instance: 'https://saavn.dev',
      success: false,
      error: error.message
    };
  }
}

async function fetchFromPiped(videoId) {
  const instances = await getDynamicInstances();
  const pipedInstances = instances.piped || [];

  if (pipedInstances.length === 0) {
    return {
      service: 'piped',
      instance: 'none',
      success: false,
      error: 'No Piped instances available'
    };
  }

  // Try instances one by one until we find a working one
  for (const instance of pipedInstances) {
    try {
      const response = await axios.get(`${instance}/streams/${videoId}`, {
        timeout: 10000
      });

      if (response.data && response.data.audioStreams && response.data.audioStreams.length > 0) {
        // Collect all streaming URLs from audio streams
        const streamingUrls = response.data.audioStreams.map(stream => ({
          url: stream.url,
          format: stream.format,
          quality: stream.quality,
          mimeType: stream.mimeType,
          codec: stream.codec,
          audioTrackId: stream.audioTrackId,
          audioTrackName: stream.audioTrackName,
          audioTrackType: stream.audioTrackType,
          audioTrackLocale: stream.audioTrackLocale,
          videoOnly: stream.videoOnly,
          itag: stream.itag,
          bitrate: stream.bitrate,
          initStart: stream.initStart,
          initEnd: stream.initEnd,
          indexStart: stream.indexStart,
          indexEnd: stream.indexEnd,
          width: stream.width,
          height: stream.height,
          fps: stream.fps,
          contentLength: stream.contentLength
        }));

        return {
          service: 'piped',
          instance: instance,
          success: true,
          streamingUrls: streamingUrls,
          metadata: {
            id: videoId,
            title: response.data.title || '',
            uploader: response.data.uploader || '',
            uploaderUrl: response.data.uploaderUrl || '',
            uploaderAvatar: response.data.uploaderAvatar || '',
            thumbnail: response.data.thumbnailUrl || '',
            duration: response.data.duration || 0,
            views: response.data.views || 0,
            likes: response.data.likes || 0,
            dislikes: response.data.dislikes || 0,
            description: response.data.description || '',
            uploadDate: response.data.uploadDate || '',
            category: response.data.category || '',
            license: response.data.license || '',
            visibility: response.data.visibility || '',
            tags: response.data.tags || [],
            uploaderVerified: response.data.uploaderVerified || false,
            uploaderSubscriberCount: response.data.uploaderSubscriberCount || 0,
            uploaded: response.data.uploaded || 0,
            livestream: response.data.livestream || false,
            proxyUrl: response.data.proxyUrl || ''
          }
        };
      }
    } catch (error) {
      // Continue to next instance
      continue;
    }
  }

  return {
    service: 'piped',
    instance: 'none',
    success: false,
    error: 'No working Piped instances found'
  };
}

async function fetchFromInvidious(videoId) {
  const instances = await getDynamicInstances();
  const invidiousInstances = instances.invidious || [];

  if (invidiousInstances.length === 0) {
    return {
      service: 'invidious',
      instance: 'none',
      success: false,
      error: 'No Invidious instances available'
    };
  }

  // Try instances one by one until we find a working one
  for (const instance of invidiousInstances) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
        timeout: 10000
      });

      if (response.data) {
        // Collect all audio streaming URLs from adaptive formats
        const audioFormats = response.data.adaptiveFormats?.filter(format =>
          format.type?.includes('audio') || format.mimeType?.includes('audio')
        ) || [];

        const streamingUrls = audioFormats.map(format => ({
          url: format.url,
          init: format.init,
          index: format.index,
          bitrate: format.bitrate,
          itag: format.itag,
          type: format.type,
          clen: format.clen,
          lmt: format.lmt,
          projectionType: format.projectionType,
          container: format.container,
          encoding: format.encoding,
          audioQuality: format.audioQuality,
          audioSampleRate: format.audioSampleRate,
          audioChannels: format.audioChannels
        }));

        return {
          service: 'invidious',
          instance: instance,
          success: true,
          streamingUrls: streamingUrls,
          metadata: {
            id: videoId,
            type: response.data.type || '',
            title: response.data.title || '',
            videoId: response.data.videoId || '',
            videoThumbnails: response.data.videoThumbnails || [],
            storyboards: response.data.storyboards || [],
            description: response.data.description || '',
            descriptionHtml: response.data.descriptionHtml || '',
            published: response.data.published || 0,
            publishedText: response.data.publishedText || '',
            keywords: response.data.keywords || [],
            viewCount: response.data.viewCount || 0,
            likeCount: response.data.likeCount || 0,
            dislikeCount: response.data.dislikeCount || 0,
            paid: response.data.paid || false,
            premium: response.data.premium || false,
            isFamilyFriendly: response.data.isFamilyFriendly || false,
            allowedRegions: response.data.allowedRegions || [],
            genre: response.data.genre || '',
            genreUrl: response.data.genreUrl || null,
            author: response.data.author || '',
            authorId: response.data.authorId || '',
            authorUrl: response.data.authorUrl || '',
            authorVerified: response.data.authorVerified || false,
            authorThumbnails: response.data.authorThumbnails || [],
            subCountText: response.data.subCountText || '',
            lengthSeconds: response.data.lengthSeconds || 0,
            allowRatings: response.data.allowRatings || false,
            rating: response.data.rating || 0,
            isListed: response.data.isListed || false,
            liveNow: response.data.liveNow || false,
            isPostLiveDvr: response.data.isPostLiveDvr || false,
            isUpcoming: response.data.isUpcoming || false,
            dashUrl: response.data.dashUrl || '',
            formatStreams: response.data.formatStreams || [],
            captions: response.data.captions || [],
            recommendedVideos: response.data.recommendedVideos || []
          }
        };
      }
    } catch (error) {
      // Continue to next instance
      continue;
    }
  }

  return {
    service: 'invidious',
    instance: 'none',
    success: false,
    error: 'No working Invidious instances found'
  };
}

/**
 * @swagger
 * /api/stream:
 *   get:
 *     summary: Get streaming data from multiple sources
 *     tags: [Stream]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID for Piped/Invidious
 *       - in: query
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Song title for Saavn
 *       - in: query
 *         name: artist
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist name for Saavn
 *     responses:
 *       200:
 *         description: Streaming data from all sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     saavn:
 *                       type: object
 *                     piped:
 *                       type: array
 *                     invidious:
 *                       type: array
 *       400:
 *         description: Missing required parameters
 */
router.get('/stream', async (req, res) => {
  const { id, title, artist } = req.query;

  if (!id || !title || !artist) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: id, title, and artist are required'
    });
  }

  try {
    // First check Saavn
    const saavnResult = await fetchFromSaavn(title, artist);

    if (saavnResult.success) {
      // Saavn found a match, return it
      res.json({
        success: true,
        service: saavnResult.service,
        // per request: omit instance for Saavn responses
        streamUrl: saavnResult.streamUrl || null,
        streamingUrls: saavnResult.streamingUrls,
        metadata: saavnResult.metadata,
        requestedId: id,
        requestedTitle: title,
        requestedArtist: artist,
        timestamp: new Date().toISOString()
      });
    } else {
      // Saavn failed, fetch from all other sources in parallel
      const [pipedResult, invidiousResult] = await Promise.all([
        fetchFromPiped(id),
        fetchFromInvidious(id)
      ]);

      // Check results in priority order: Piped first, then Invidious
      if (pipedResult.success) {
        res.json({
          success: true,
          service: pipedResult.service,
          instance: pipedResult.instance,
          streamingUrls: pipedResult.streamingUrls,
          metadata: pipedResult.metadata,
          requestedId: id,
          requestedTitle: title,
          requestedArtist: artist,
          timestamp: new Date().toISOString()
        });
      } else if (invidiousResult.success) {
        res.json({
          success: true,
          service: invidiousResult.service,
          instance: invidiousResult.instance,
          streamingUrls: invidiousResult.streamingUrls,
          metadata: invidiousResult.metadata,
          requestedId: id,
          requestedTitle: title,
          requestedArtist: artist,
          timestamp: new Date().toISOString()
        });
      } else {
        // All sources failed
        res.status(404).json({
          success: false,
          error: 'No streaming data found from any source',
          requestedId: id,
          requestedTitle: title,
          requestedArtist: artist,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Stream endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      requestedId: id,
      requestedTitle: title,
      requestedArtist: artist,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search YouTube Music
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
 *           enum: [songs, videos, albums, artists, playlists, profiles, podcasts, episodes, community_playlists]
 *         description: Restrict results to a specific type
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *         description: Continuation token for pagination
 *       - in: query
 *         name: ignore_spelling
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to ignore spelling corrections
 *     responses:
 *       200:
 *         description: Search results with continuation token
 *       400:
 *         description: Missing/invalid params
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, filter, continuationToken, ignore_spelling = false } = req.query;

    // FIXED: Don't require query if continuation token is provided
    if (!query && !continuationToken) {
      return res.status(400).json({ error: "Missing required query parameter 'q' or 'continuationToken'" });
    }

    if (filter && !ALLOWED_FILTERS.has(filter)) {
      return res.status(400).json({
        error: `Invalid filter. Allowed: ${Array.from(ALLOWED_FILTERS).sort()}`
      });
    }

    const ytmusic = req.app.locals.ytmusic;

    // FIXED: Pass query only if it's not a continuation request
    const searchResults = await ytmusic.search(
      query || null,
      filter,
      continuationToken,
      ignore_spelling === 'true'
    );

    res.json({
      query: query || null,
      filter,
      results: searchResults.results,
      continuationToken: searchResults.continuationToken
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: `Search failed: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial query to get suggestions for
 *       - in: query
 *         name: music
 *         schema:
 *           type: integer
 *         description: If 1, get suggestions from YouTube Music. If not present or 0, get suggestions from YouTube
 *     responses:
 *       200:
 *         description: Suggestions
 *       400:
 *         description: Missing/invalid params
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q: query, music } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Missing required query parameter 'q'" });
    }

    const ytmusic = req.app.locals.ytmusic;
    const youtubeSearch = req.app.locals.youtubeSearch;

    if (music === '1') {
      // Get suggestions from YouTube Music
      let suggestions = await ytmusic.getSearchSuggestions(query);
      // Fallback to standard YouTube if empty
      if (!suggestions || suggestions.length === 0) {
        const fallback = await youtubeSearch.getSuggestions(query);
        return res.json({ suggestions: fallback, source: 'youtube_music_fallback' });
      }
      return res.json({ suggestions, source: 'youtube_music' });
    } else {
      // Get suggestions from YouTube
      const suggestions = await youtubeSearch.getSuggestions(query);
      return res.json({ suggestions, source: 'youtube' });
    }
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: `Suggestions failed: ${error.message}` });
  }
});

/**
 * @swagger
 * /api/search/suggestions/debug:
 *   get:
 *     summary: Debug endpoint to test YouTube suggestions API directly
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Query to test
 *     responses:
 *       200:
 *         description: Debug suggestions
 *       400:
 *         description: Missing query parameter
 */
router.get('/search/suggestions/debug', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Missing required query parameter 'q'" });
    }

    const youtubeSearch = req.app.locals.youtubeSearch;
    const suggestions = await youtubeSearch.getSuggestions(query);

    res.json({
      query,
      suggestions,
      count: suggestions.length,
      source: 'youtube_debug'
    });
  } catch (error) {
    console.error('Debug suggestions error:', error);
    res.status(500).json({
      error: `Debug failed: ${error.message}`,
      query: req.query.q
    });
  }
});

/**
 * GET /api/similar
 * Query params: title, artist, limit (optional, default 5)
 * Uses Last.fm to fetch similar tracks, then concurrently fetches YouTube matches.
 */
router.get('/similar', async (req, res) => {
  try {
    const { title, artist, limit } = req.query;
    // Use embedded key if env var missing
    const apiKey = process.env.LASTFM_API_KEY || LASTFM_API_KEY;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Missing title or artist parameter' });
    }

    const lastFmData = await getSimilarTracks(String(title), String(artist), apiKey, String(limit || '5'));

    if (lastFmData && lastFmData.error) {
      return res.status(500).json({ error: lastFmData.error });
    }

    const youtubeSearchPromises = lastFmData.map(t => getYouTubeSong(`${t.title} ${t.artist}`));
    const allYoutubeResults = await Promise.all(youtubeSearchPromises);
    const matched = allYoutubeResults.filter(r => r && r.id);

    return res.status(200).json(matched);
  } catch (error) {
    console.error('Error in /api/similar:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

// Helper to send consistent JSON response with cache headers
function sendJson(res, body, cacheControl = 'private') {
  console.log(`[SENDJSON] Sending response:`, {
    status: 200,
    cacheControl,
    bodyLength: Array.isArray(body) ? body.length : 'not-array',
    timestamp: new Date().toISOString()
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', cacheControl);
  res.status(200).send(JSON.stringify(body));
}

function invalidRequest(res, message = 'Invalid request') {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private');
  res.status(400).send(JSON.stringify({
    error: true,
    message
  }));
}

function authFailure(res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private');
  res.status(401).send(JSON.stringify({
    error: true,
    message: 'Authentication failed'
  }));
}

// GET /api/feed?authToken=...
router.get('/feed', (req, res) => {
  const authToken = req.query.authToken;
  const preview = req.query.preview === '1' || req.query.preview === 1;

  if (!authToken || String(authToken).trim() === '') {
    return invalidRequest(res, 'session is a required parameter');
  }

  const channelIds = sessionToChannelIds.get(String(authToken));
  if (!channelIds || channelIds.size === 0) {
    return authFailure(res);
  }

  (async () => {
    try {
      // For preview mode, fetch more per channel, then globally limit to top 5 across all channels
      const perChannelLimit = preview ? undefined : undefined;
      const promises = Array.from(channelIds, id => fetchChannelItems(id, perChannelLimit));
      const settled = await Promise.allSettled(promises);
      let results = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      // Filter out shorts if any flag present
      results = results.filter(item => !item.isShort);
      // Sort by newest first, then by highest views
      results.sort((a, b) => {
        if (b.uploaded !== a.uploaded) return b.uploaded - a.uploaded;
        const av = Number(a.views || 0);
        const bv = Number(b.views || 0);
        return bv - av;
      });
      // If preview, return only the top 5 across all channels
      if (preview) {
        results = results.slice(0, 5);
      }
      return sendJson(res, results, 'private');
    } catch (e) {
      return authFailure(res);
    }
  })();
});

// GET /api/feed/unauthenticated?channels=UCxxx,UCyyy
router.get('/feed/unauthenticated', (req, res) => {
  const channelsParam = req.query.channels;
  const preview = req.query.preview === '1' || req.query.preview === 1;

  if (!channelsParam || String(channelsParam).trim() === '') {
    return invalidRequest(res, 'No valid channel IDs provided');
  }

  const channelIds = String(channelsParam)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (channelIds.length === 0) {
    return sendJson(res, [], 'public, s-maxage=120');
  }

  (async () => {
    try {
      // YouTube.js removed - using direct Browse API
      const perChannelLimit = preview ? 5 : undefined;
      const promises = channelIds.map(id => fetchChannelItems(id, perChannelLimit));
      const settled = await Promise.allSettled(promises);
      let results = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      // RSS fallback removed - using only Browse API

      results.sort((a, b) => b.uploaded - a.uploaded);
      return sendJson(res, results, 'public, s-maxage=120');
    } catch (e) {
      return sendJson(res, [], 'public, s-maxage=120');
    }
  })();
});

// ... existing imports
const youtubeiClient = require('../lib/youtubei-client');

// ... existing code ...

// GET /api/album/:id - Fetch album data from YouTube Music
router.get('/album/:id', async (req, res) => {
  const albumId = req.params.id;

  console.log(`[ALBUM] Fetching album ${albumId}`);

  if (!albumId || String(albumId).trim() === '') {
    return res.status(400).json({ error: 'Album ID is required' });
  }

  try {
    const albumData = await youtubeiClient.getAlbum(albumId);
    return res.json(albumData);
  } catch (error) {
    console.error(`[ALBUM] Error fetching album ${albumId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch album data',
      message: error.message
    });
  }
});

// GET /api/playlist/:id - Fetch playlist data from YouTube Music
router.get('/playlist/:id', async (req, res) => {
  const playlistId = req.params.id;

  console.log(`[PLAYLIST] Fetching playlist ${playlistId}`);

  if (!playlistId || String(playlistId).trim() === '') {
    return res.status(400).json({ error: 'Playlist ID is required' });
  }

  try {
    const playlistData = await youtubeiClient.getPlaylist(playlistId);
    return res.json(playlistData);
  } catch (error) {
    console.error(`[PLAYLIST] Error fetching playlist ${playlistId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch playlist data',
      message: error.message
    });
  }
});

// GET /api/feed/channels=UCxxx,UCyyy[?preview=1]
router.get('/feed/channels=:channels', (req, res) => {
  // ... existing code ...
  console.log(`[ROUTE] /feed/channels=:channels route hit!`);
  const channelsParam = req.params.channels;
  const preview = req.query.preview === '1' || req.query.preview === 1;

  console.log(`[FEED/CHANNELS] Request received:`, {
    channelsParam,
    preview,
    userAgent: req.get('User-Agent'),
    ifNoneMatch: req.get('If-None-Match'),
    ifModifiedSince: req.get('If-Modified-Since'),
    cacheControl: req.get('Cache-Control'),
    timestamp: new Date().toISOString()
  });

  if (!channelsParam || String(channelsParam).trim() === '') {
    console.log(`[FEED/CHANNELS] Invalid request - no channels provided`);
    return invalidRequest(res, 'No valid channel IDs provided');
  }

  const channelIds = String(channelsParam)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(id => id.split('&')[0]); // Remove query parameters from channel IDs

  console.log(`[FEED/CHANNELS] Parsed channel IDs:`, channelIds);

  if (channelIds.length === 0) {
    console.log(`[FEED/CHANNELS] No valid channel IDs after parsing`);
    return sendJson(res, [], 'public, s-maxage=120');
  }

  (async () => {
    try {
      console.log(`[FEED/CHANNELS] Starting fetch for ${channelIds.length} channels, preview=${preview}`);
      const startTime = Date.now();

      // YouTube.js removed - using direct Browse API
      const perChannelLimit = preview ? 5 : undefined;
      const promises = channelIds.map(id => fetchChannelItems(id, perChannelLimit));
      const settled = await Promise.allSettled(promises);
      let results = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      // RSS fallback removed - using only Browse API

      console.log(`[FEED/CHANNELS] Fetch completed in ${Date.now() - startTime}ms, got ${results.length} items`);

      // Filter out shorts and sort by upload date
      results = results
        .filter(item => !item.isShort) // Filter out shorts
        .sort((a, b) => b.uploaded - a.uploaded); // Sort by upload date (newest first)

      console.log(`[FEED/CHANNELS] After filtering shorts: ${results.length} items`);

      // If preview mode, limit to 5 latest videos per channel
      if (preview) {
        const channelCounts = new Map();
        results = results.filter(item => {
          const channelId = item.authorId;
          const count = channelCounts.get(channelId) || 0;
          if (count < 5) {
            channelCounts.set(channelId, count + 1);
            return true;
          }
          return false;
        });
        console.log(`[FEED/CHANNELS] After preview limit (5 per channel): ${results.length} items`);
      }

      console.log(`[FEED/CHANNELS] Sending response with ${results.length} items`);
      return sendJson(res, results, 'public, s-maxage=120');
    } catch (e) {
      console.error(`[FEED/CHANNELS] Error occurred:`, e);
      return sendJson(res, [], 'public, s-maxage=120');
    }
  })();
});

module.exports = router;
