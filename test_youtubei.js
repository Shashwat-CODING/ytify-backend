const { Innertube } = require('youtubei.js');

(async () => {
    try {
        const youtube = await Innertube.create();

        console.log('--- Searching Generic ---');
        const search = await youtube.music.search('Thriller');

        if (search.contents) {
            console.log('Contents is array:', Array.isArray(search.contents));
            const firstContent = search.contents[0];
            console.log('First content type:', firstContent.type);
            console.log('First content keys:', Object.keys(firstContent));

            // Try to find where the actual items are
            // Usually in a Shelf or ItemSection
            if (firstContent.contents) {
                console.log('First content contents length:', firstContent.contents.length);
                console.log('First item in first content:', firstContent.contents[0].type);
            }
        }
        console.log('Search results type:', typeof search.results);
        if (search.results) {
            console.log('Results found:', search.results.length);
        } else {
            console.log('No results property');
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
