const axios = require('axios');

const YOUTUBE_MUSIC_API_URL = 'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false';

async function getArtistData(artistId, countryCode = 'US') {
    const requestBody = {
        browseId: artistId,
        context: {
            client: {
                hl: "en",
                gl: countryCode,
                remoteHost: "2a09:bac5:3b43:1aaa:0:0:2a8:78",
                deviceMake: "Apple",
                deviceModel: "",
                visitorData: "Cgtkc19JRmZ1RXdvNCiWj7fHBjIKCgJJThIEGgAgPQ%3D%3D",
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
                clientName: "WEB_REMIX",
                clientVersion: "1.20251013.03.00",
                osName: "Macintosh",
                osVersion: "10_15_7",
                originalUrl: `https://music.youtube.com/channel/${artistId}`,
                platform: "DESKTOP",
                clientFormFactor: "UNKNOWN_FORM_FACTOR",
                configInfo: {
                    appInstallData: "CJaPt8cGEODpzxwQ-ofQHBCHrM4cEPnQzxwQ3rzOHBDaitAcEMj3zxwQlIPQHBDhjNAcEJWxgBMQ9quwBRDYjdAcEMvRsQUQzo3QHBDa984cEMT0zxwQmejOHBCYuc8cELj2zxwQ18GxBRCzkM8cELargBMQzN-uBRCIh7AFEN7pzxwQ0-GvBRCW288cEKaasAUQieiuBRDRsYATEJGM_xIQgffPHBD7tM8cENmF0BwQ_LLOHBC9irAFEMXDzxwQlP6wBRCNzLAFELvZzhwQgpTQHBDni9AcENaN0BwQuOTOHBCc188cEPLozxwQ4tSuBRC-poATEJX3zxwQq_jOHBDJ968FEK7WzxwQjOnPHBCZjbEFEJ3QsAUQ4M2xBRD3qoATEJuI0BwQudnOHBC9tq4FEIv3zxwQt-TPHBDEgtAcEIKPzxwQre_PHBCZmLEFEJTyzxwQt-r-EhDN0bEFEIHNzhwQmsrPHBCvhs8cEImwzhwQ54_QHBD6_88cEL2ZsAUQ2tHPHBDrgdAcEPXbzxwQqbKAExCKgtAcKkhDQU1TTVJVcS1acS1ETWVVRXYwVjU5VG1DOFBzRkxYTUJvZE1NcUNzQkFQTl93V1FVLUUyeWkya1l1TTNyZ0tjUi1vbkhRYz0wAA%3D%3D"
                },
                userInterfaceTheme: "USER_INTERFACE_THEME_DARK",
                timeZone: "Asia/Calcutta",
                browserName: "Chrome",
                browserVersion: "141.0.0.0",
                memoryTotalKbytes: "8000000",
                acceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            }
        },
    };

    try {
        const response = await axios.post(YOUTUBE_MUSIC_API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
                'Origin': 'https://music.youtube.com',
                'Referer': 'https://music.youtube.com/',
                'X-Origin': 'https://music.youtube.com',
                'X-YouTube-Client-Name': '67',
                'X-YouTube-Client-Version': '1.20251013.03.00'
            }
        });

        const data = response.data;

        if (!data.header?.musicImmersiveHeaderRenderer) {
            console.log('DEBUG: musicImmersiveHeaderRenderer not found');
            console.log('DEBUG: data keys:', Object.keys(data));
            if (data.microformat) {
                console.log('DEBUG: microformat:', JSON.stringify(data.microformat, null, 2));
            }
            if (data.header) console.log('DEBUG: header keys:', Object.keys(data.header));
            // Check if it's a different renderer
            if (data.header?.musicDetailHeaderRenderer) {
                console.log('DEBUG: Found musicDetailHeaderRenderer instead');
            }
            return {};
        }

        const contents = data.contents.singleColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents;
        const artistName = data.header.musicImmersiveHeaderRenderer.title.runs[0].text;
        const thumbnail = data.header.musicImmersiveHeaderRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url || '';

        const topSongsShelf = contents.find(
            (item) => item.musicShelfRenderer && item.musicShelfRenderer.title.runs[0].text === 'Top songs'
        );
        const playlistId = topSongsShelf?.musicShelfRenderer.contents[0].musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint?.watchEndpoint.playlistId;

        const recommendedArtistsShelf = contents.find(
            (item) => item.musicCarouselShelfRenderer && item.musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text === 'Fans might also like'
        );

        const recommendedArtists = recommendedArtistsShelf?.musicCarouselShelfRenderer.contents.map(
            (item) => ({
                name: item.musicTwoRowItemRenderer.title.runs[0].text,
                browseId: item.musicTwoRowItemRenderer.navigationEndpoint.browseEndpoint?.browseId,
                thumbnail: item.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
            })
        );

        const featuredOnShelf = contents.find(
            (item) => item.musicCarouselShelfRenderer && item.musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text === 'Featured on'
        );

        const featuredOnPlaylists = featuredOnShelf?.musicCarouselShelfRenderer.contents.map(
            (item) => ({
                title: item.musicTwoRowItemRenderer.title.runs[0].text,
                browseId: item.musicTwoRowItemRenderer.navigationEndpoint.browseEndpoint?.browseId,
                thumbnail: item.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
            })
        );

        const albumsShelf = contents.find(
            (item) => item.musicCarouselShelfRenderer && item.musicCarouselShelfRenderer.header.musicCarouselShelfBasicHeaderRenderer.title.runs[0].text === 'Albums'
        );

        const albums = albumsShelf?.musicCarouselShelfRenderer.contents.map(
            (item) => {
                const shufflePlayItem = item.musicTwoRowItemRenderer.menu?.menuRenderer.items.find(
                    (menuItem) => menuItem.menuNavigationItemRenderer.text.runs[0].text === 'Shuffle play'
                );
                let playlistId = shufflePlayItem?.menuNavigationItemRenderer.navigationEndpoint.watchPlaylistEndpoint.playlistId;

                if (playlistId && playlistId.startsWith('VL')) {
                    playlistId = playlistId.substring(2);
                }

                return {
                    id: playlistId,
                    subtitle: item.musicTwoRowItemRenderer.subtitle.runs.slice(-1)[0].text,
                    thumbnail: item.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
                    title: item.musicTwoRowItemRenderer.title.runs[0].text,
                };
            }
        );

        return {
            artistName,
            thumbnail,
            playlistId,
            recommendedArtists,
            featuredOnPlaylists,
            albums,
        };
    } catch (error) {
        if (error.response) {
            throw new Error(`HTTP error! Status: ${error.response.status}`);
        }
        throw error;
    }
}

async function getArtistsData(artistIdParam, countryCode = 'US') {
    if (typeof artistIdParam === 'string' && artistIdParam.includes(',')) {
        const artistIds = artistIdParam.split(',');
        const artistDataPromises = artistIds.map(id => getArtistData(id, countryCode));
        const results = await Promise.all(artistDataPromises);
        const resultsWithoutAlbums = results.map((artist) => {
            if (artist && typeof artist === 'object' && 'albums' in artist) {
                const { albums, ...rest } = artist;
                return rest;
            }
            return artist;
        });
        return resultsWithoutAlbums;
    } else {
        const artistData = await getArtistData(artistIdParam, countryCode);
        if (!artistData || Object.keys(artistData).length === 0) {
            throw new Error('Artist not found');
        }
        const { artistName, playlistId, albums, thumbnail } = artistData;
        return { artistName, playlistId, albums, thumbnail };
    }
}

module.exports = { getArtistsData };
