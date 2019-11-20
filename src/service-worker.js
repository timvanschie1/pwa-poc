self.addEventListener('activate', event => {
    clients.claim();
    console.log('Ready to handle fetches');
});

self.addEventListener('fetch', event => {
    const url = event.request.url;

    const isExtension = !(url.indexOf('http') === 0);
    if (isExtension) {
        return;
    }

    event.respondWith(async function () {
        const isWebpackThingy = url.includes('sockjs-node');
        if (isWebpackThingy) {
            return await fetch(url);
        }

        let fetchResponseP;
        if (url.includes('imgs.xkcd')) {
            /** Prevent CORS problems for the images by requesting via cors-anywhere */
            fetchResponseP = fetch('https://cors-anywhere.herokuapp.com/' + url, {
                headers: {'X-Requested-With': 'XMLHttpRequest'}
            });
        } else {
            fetchResponseP = fetch(url);
        }

        /** Create promises for both the network response, and a copy of the response that can be used in the cache. */
        const fetchResponseCloneP = fetchResponseP.then(r => r.clone());

        /** event.waitUntil() ensures that the service worker is kept alive long enough to complete the cache update. */
        event.waitUntil(async function () {
            const cache = await caches.open('pwa-poc-xkcd');
            await cache.put(url, await fetchResponseCloneP);
        }());

        /** Prefer the cached response, falling back to the fetch response. */
        return (await caches.match(url)) || fetchResponseP;
    }());
});