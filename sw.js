self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('mws-restaurant-stage-static-v6').then(function(cache) {
            return cache.addAll(
                [
                    '/',
                    '/css/styles.min.css',
                    'idb.min.js',
                    'js/main.min.js',
                    '/js/dbhelper.min.js',
                    '/js/restaurant_info.min.js',
                    '/img/thumb/1.webp',
                    '/img/thumb/2.webp',
                    '/img/thumb/3.webp',
                    '/img/thumb/4.webp',
                    '/img/thumb/5.webp',
                    '/img/thumb/6.webp',
                    '/img/thumb/7.webp',
                    '/img/thumb/8.webp',
                    '/img/thumb/9.webp',
                    '/img/thumb/10.webp',
                    '/img/1.jpg',
                    '/img/2.jpg',
                    '/img/3.jpg',
                    '/img/4.jpg',
                    '/img/5.jpg',
                    '/img/6.jpg',
                    '/img/7.jpg',
                    '/img/8.jpg',
                    '/img/9.jpg',
                    '/img/10.jpg',
                    'index.html',
                    'restaurant.html',
                    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
                    'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
                    'data/restaurants.json'
                ]
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    console.log(event.request.url);

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
