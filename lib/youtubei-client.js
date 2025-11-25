const { Innertube } = require('youtubei.js');

class YouTubeIClient {
    constructor() {
        this.youtube = null;
        this.initPromise = this.init();
    }

    async init() {
        try {
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
}

// Singleton instance
const youtubeiClient = new YouTubeIClient();
module.exports = youtubeiClient;
