const app = require('./app');

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Create a mock request object compatible with Express
        // Note: This is a simplified adapter. For full compatibility, 
        // consider using a library like 'toucan-js' or 'hono' if possible,
        // or a more robust adapter if complex headers/bodies are needed.
        // However, for many Express apps, we can use a trick:
        // We can't easily run Express directly in the Worker environment 
        // because it relies on Node.js 'http' module which is only partially polyfilled.
        // But 'nodejs_compat' flag helps a lot.

        // Actually, a better approach with 'nodejs_compat' is to use a minimal adapter 
        // that translates the standard Request/Response to what Express expects, 
        // OR use a library designed for this. 
        // Given we want to keep it simple and use the existing app.js:

        // We will use a lightweight adapter pattern.
        // But wait, 'app' is an Express application. 
        // Express apps are just functions: (req, res) => void.
        // We need to mock 'req' and 'res'.

        // Let's try a more robust approach using 'hono' or similar is usually recommended,
        // but the user asked to deploy *this* app.
        // Let's use a simple polyfill approach for the request/response.

        // A known working pattern for Express on Workers with nodejs_compat 
        // is to use 'worktop' or just manually bridge it.
        // However, since we have 'nodejs_compat', we might be able to use 
        // 'server-less-http' or similar if we could install packages.
        // Since I cannot easily install new packages without user permission,
        // I will write a minimal adapter here.

        return new Promise((resolve, reject) => {
            // Mock Node.js Request
            const req = {
                url: url.pathname + url.search,
                method: request.method,
                headers: Object.fromEntries(request.headers),
                body: request.body, // This might need handling for streams
                query: Object.fromEntries(url.searchParams),
                // Add other necessary properties
                unpipe: () => { },
                on: (event, cb) => {
                    if (event === 'data' && request.body) {
                        // This is tricky for streams. 
                        // For simple JSON/Form data, we might need to read it first.
                    }
                    if (event === 'end') cb();
                },
                resume: () => { },
                socket: { destroy: () => { } }
            };

            // Handle Body if present
            if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
                // For simplicity, let's assume we can read the text/json
                // This is a blocking operation in this simple adapter
                request.text().then(text => {
                    req.body = text;
                    // We might need to parse it if it's JSON and Express expects object
                    // But Express middleware usually handles parsing from stream or text.
                    // If we pass text, we might need to mock a stream or set body directly
                    // if using body-parser.

                    // Actually, let's try to pass the raw body stream if possible,
                    // or just buffer it.
                    // For now, let's assume body-parser is used (it is in app.js).
                    // It expects a stream.

                    // Let's use a simpler strategy: 
                    // If we can't easily mock the stream, we might fail on POSTs.
                    // But let's try to setup the response first.
                }).catch(err => console.error(err));
            }

            // Mock Node.js Response
            const res = {
                _headers: {},
                statusCode: 200,
                setHeader(name, value) {
                    this._headers[name] = value;
                },
                getHeader(name) {
                    return this._headers[name];
                },
                status(code) {
                    this.statusCode = code;
                    return this;
                },
                json(data) {
                    this.setHeader('Content-Type', 'application/json');
                    this.send(JSON.stringify(data));
                },
                send(data) {
                    resolve(new Response(data, {
                        status: this.statusCode,
                        headers: this._headers
                    }));
                },
                end(data) {
                    this.send(data);
                },
                redirect(url) {
                    resolve(Response.redirect(url, 302));
                }
                // Add other methods as needed
            };

            // We need to handle the async nature of the body for POSTs properly.
            // A better way without external deps is hard.
            // Let's try to use the 'app' directly as a handler if possible?
            // No, app(req, res) is the signature.

            // Let's try to use a more standard "serverless" approach.
            // Since I can't install 'serverless-http', I will try to implement a basic one.

            // Re-implementing a full adapter is risky. 
            // I'll use a simplified version that supports GET mostly, 
            // and basic POST with JSON.

            // IMPORTANT: To properly support POST bodies, we need to push data to the req.
            // Let's refine the req mock.

            const { PassThrough } = require('stream');
            const reqStream = new PassThrough();

            // Copy props
            reqStream.url = url.pathname + url.search;
            reqStream.method = request.method;
            reqStream.headers = Object.fromEntries(request.headers);

            // If there is a body, write it to the stream
            if (request.body) {
                // request.body is a ReadableStream in Workers
                // We need to pipe it to the PassThrough
                const reader = request.body.getReader();
                const pump = async () => {
                    const { done, value } = await reader.read();
                    if (done) {
                        reqStream.end();
                        return;
                    }
                    reqStream.write(value);
                    pump();
                };
                pump();
            } else {
                reqStream.end();
            }

            app(reqStream, res);
        });
    }
};
