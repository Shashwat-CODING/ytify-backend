class YouTubeIClient {
    constructor() {
        this.youtube = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
            const { Innertube } = await import('youtubei.js');
            this.youtube = await Innertube.create();
            console.log('[YouTubeI] Client initialized successfully');
        } catch (error) {
            console.error('[YouTubeI] Initialization failed:', error);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.youtube) {
            await this.initPromise;
        }
        return this.youtube;
    }

    async getAlbum(albumId) {
        const yt = await this.ensureInitialized();
        try {
            const album = await yt.music.getAlbum(albumId);
            return this._normalizeAlbum(album, albumId);
        } catch (error) {
            console.error(`[YouTubeI] Failed to fetch album ${albumId}:`, error);
            throw error;
        }
    }

    async getPlaylist(playlistId) {
        const yt = await this.ensureInitialized();
        try {
            const playlist = await yt.music.getPlaylist(playlistId);
            return this._normalizePlaylist(playlist, playlistId);
        } catch (error) {
            console.error(`[YouTubeI] Failed to fetch playlist ${playlistId}:`, error);
            throw error;
        }
    }

    _normalizeAlbum(album, id) {
        // Extract tracks
        const tracks = (album.contents || []).map(track => this._normalizeTrack(track, album.header?.title?.text));

        return {
            id: id,
            title: album.header?.title?.text || '',
            artist: album.header?.subtitle?.runs?.map(r => r.text).join('') || '',
            year: album.header?.subtitle?.runs?.find(r => /^\d{4}$/.test(r.text))?.text || '',
            thumbnail: album.header?.thumbnail?.contents?.[0]?.url || '', // Adjust based on actual structure
            tracks: tracks,
            type: 'album'
        };
    }

    _normalizePlaylist(playlist, id) {
        // Extract tracks
        const tracks = (playlist.items || []).map(track => this._normalizeTrack(track));

        return {
            id: id,
            title: playlist.header?.title?.text || '',
            author: playlist.header?.subtitle?.runs?.map(r => r.text).join('') || '',
            thumbnail: playlist.header?.thumbnail?.contents?.[0]?.url || '', // Adjust based on actual structure
            tracks: tracks,
            type: 'playlist'
        };
    }

    _normalizeTrack(track, albumName = '') {
        // Handle different track types (MusicResponsiveListItem usually)
        const title = track.title || track.name || '';
        const artists = track.artists || [];
        const album = track.album || { name: albumName };
        const duration = track.duration?.text || track.duration || '';
        const id = track.id || track.videoId || '';
        const thumbnail = track.thumbnails?.[0]?.url || '';

        return {
            id: id,
            title: title,
            artist: artists.map(a => a.name).join(', '),
            album: album.name || '',
            duration: duration,
            thumbnail: thumbnail,
            videoId: id
        };
    }
    async getTrending() {
        const yt = await this.ensureInitialized();
        try {
            // Use YouTube Music home page instead of Explore
            const home = await yt.music.getHomeFeed();

            const allSongs = [];
            const allVideos = [];
            const allPlaylists = [];

            // Process all sections from home page
            for (const section of home.sections || []) {
                const sectionTitle = section.title?.text || section.header?.title?.text || '';
                const items = section.contents || [];

                // Skip empty sections
                if (items.length === 0) continue;

                // Normalize all items
                const normalizedItems = items
                    .map(item => this._normalizeResponsiveListItem(item))
                    .filter(item => item.id);

                // Categorize based on section title
                const lowerTitle = sectionTitle.toLowerCase();

                if (lowerTitle.includes('album') ||
                    lowerTitle.includes('playlist') ||
                    lowerTitle.includes('mix')) {
                    // Albums and playlists
                    allPlaylists.push(...normalizedItems);
                } else if (lowerTitle.includes('video')) {
                    // Videos
                    allVideos.push(...normalizedItems);
                } else {
                    // Everything else goes to songs (Quick picks, etc.)
                    allSongs.push(...normalizedItems);
                }
            }

            // Remove duplicates and limit results
            const uniqueSongs = this._removeDuplicates(allSongs).slice(0, 20);
            const uniqueVideos = this._removeDuplicates(allVideos).slice(0, 20);
            const uniquePlaylists = this._removeDuplicates(allPlaylists).slice(0, 10);

            return {
                songs: uniqueSongs,
                videos: uniqueVideos,
                playlists: uniquePlaylists
            };

        } catch (error) {
            console.error('[YouTubeI] Failed to fetch trending:', error);
            throw error;
        }
    }

    _removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }

    async getRelated(videoId) {
        const yt = await this.ensureInitialized();
        try {
            // Use regular YouTube API (not music) for better related videos support
            const info = await yt.getInfo(videoId);

            // Get related videos from watch_next_feed
            const watchNextFeed = info.watch_next_feed || [];

            // Filter to only LockupView items (actual video recommendations)
            const items = watchNextFeed.filter(item => item.type === 'LockupView');
            console.log(`[YouTubeI] Found ${items.length} LockupView items in watch_next_feed`);

            const normalized = items
                .map(item => {
                    const result = this._normalizeRelatedItem(item);
                    if (!result.videoId || !result.title) {
                        console.log('[YouTubeI] Filtered out item - missing videoId or title:', { videoId: result.videoId, title: result.title });
                    }
                    return result;
                })
                .filter(item => {
                    // Filter out items without required fields
                    if (!item.videoId || !item.title) return false;

                    // Filter out shorts (duration <= 60 seconds)
                    if (item.duration_seconds && item.duration_seconds <= 60) return false;

                    // Filter out items marked as shorts
                    if (item.isShort) return false;

                    return true;
                });

            console.log(`[YouTubeI] Returning ${normalized.length} related videos after filtering`);
            return normalized;
        } catch (error) {
            console.error(`[YouTubeI] Failed to fetch related for ${videoId}:`, error);
            throw error;
        }
    }

    _normalizeRelatedItem(item) {
        if (!item || item.type !== 'LockupView') return {};

        // Extract video ID from nested structure
        let videoId = '';
        // Try to find video ID in the Add to Queue button payload
        if (item.content_image?.overlays) {
            for (const overlay of item.content_image.overlays) {
                if (overlay.type === 'ThumbnailHoverOverlayToggleActionsView' && overlay.buttons) {
                    for (const button of overlay.buttons) {
                        // Check in command actions array
                        const actions = button.default_button?.on_tap?.command?.actions;
                        if (actions && actions.length > 0) {
                            videoId = actions[0].video_id;
                            if (videoId) break;
                        }

                        // Fallback: check direct command video_id
                        if (!videoId) {
                            videoId = button.default_button?.on_tap?.command?.video_id || '';
                        }

                        if (videoId) break;
                    }
                }
                if (videoId) break;
            }
        }

        // Fallback: try to get from content_position on_tap endpoint
        if (!videoId && item.content_position?.on_tap) {
            videoId = item.content_position.on_tap.payload?.videoId || item.content_position.on_tap.payload?.watchEndpoint?.videoId || '';
        }

        // Extract title from metadata
        const title = item.metadata?.title?.text || item.metadata?.title?.runs?.map(r => r.text).join('') || '';

        // Extract thumbnail
        const thumbnail = item.content_image?.image?.[0]?.url || '';

        // Extract duration from badge
        let duration = '';
        let duration_seconds = 0;
        if (item.content_image?.overlays) {
            for (const overlay of item.content_image.overlays) {
                if (overlay.type === 'ThumbnailOverlayBadgeView' && overlay.badges) {
                    for (const badge of overlay.badges) {
                        if (badge.type === 'ThumbnailBadgeView' && badge.text) {
                            duration = badge.text;
                            duration_seconds = this._parseDuration(duration);
                            break;
                        }
                    }
                }
                if (duration) break;
            }
        }

        // Extract author from metadata subtitle
        const author = item.metadata?.subtitle?.text || item.metadata?.subtitle?.runs?.map(r => r.text).join(' ') || '';

        // Check if it's a short
        const isShort = (duration_seconds > 0 && duration_seconds <= 60) || false;

        return {
            videoId,
            title,
            artist: author,
            thumbnail,
            duration,
            duration_seconds,
            isShort
        };
    }

    _parseDuration(durationStr) {
        if (!durationStr || typeof durationStr !== 'string') return 0;

        const parts = durationStr.split(':').map(p => parseInt(p) || 0);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            return parts[0];
        }
        return 0;
    }

    _normalizeResponsiveListItem(item) {
        if (!item) return {};

        let id = item.id || item.videoId || item.endpoint?.payload?.videoId || item.endpoint?.payload?.browseId || '';
        let title = item.title?.text || item.title?.runs?.map(r => r.text).join('') || item.title || '';
        let artist = '';
        let album = '';
        let duration = '';
        let thumbnail = '';
        let views = '';

        // Handle MusicResponsiveListItem
        if (item.type === 'MusicResponsiveListItem') {
            if (item.flex_columns && item.flex_columns.length > 0) {
                title = item.flex_columns[0].title?.text ||
                    item.flex_columns[0].title?.runs?.map(r => r.text).join('') || title;

                if (item.flex_columns.length > 1) {
                    const subtitleRuns = item.flex_columns[1].title?.runs || [];
                    const textParts = subtitleRuns.map(r => r.text).filter(t => t !== ' • ');

                    textParts.forEach(part => {
                        if (/^\d{4}$/.test(part)) {
                            // Year, ignore or set
                        } else if (/^\d+:\d+$/.test(part) || /^\d+:\d+:\d+$/.test(part)) {
                            duration = part;
                        } else if (part.includes('views') || part.includes('view')) {
                            views = part;
                        } else if (!artist) {
                            artist = part;
                        } else {
                            album = part;
                        }
                    });
                }
            }
            thumbnail = item.thumbnails?.[0]?.url || item.thumbnail?.contents?.[0]?.url || '';
        }
        // Handle MusicTwoRowItem
        else if (item.type === 'MusicTwoRowItem') {
            if (item.artists) {
                artist = item.artists.map(a => a.name).join(', ');
            }
            if (item.views) {
                views = item.views;
            }

            if (!artist) {
                const subtitleRuns = item.subtitle?.runs || [];
                const textParts = subtitleRuns.map(r => r.text).filter(t => t !== ' • ');
                textParts.forEach(part => {
                    if (part.includes('views') || part.includes('view')) views = part;
                    else if (!artist) artist = part;
                });
            }

            if (Array.isArray(item.thumbnail)) {
                thumbnail = item.thumbnail[0].url;
            } else if (item.thumbnails) {
                thumbnail = item.thumbnails[0].url;
            } else {
                thumbnail = item.thumbnail?.contents?.[0]?.url || '';
            }
        }

        return {
            id,
            title,
            artist,
            album,
            duration,
            thumbnail,
            views,
            type: item.type
        };
    }
}

// Singleton instance
const youtubeiClient = new YouTubeIClient();
module.exports = youtubeiClient;
