/**
 * Common database helper functions.
 */

// adding values into the db
    /*
var dbPromise = idb.open('test-db', 1, function(upgradeDb) {
  var keyValStore = upgradeDb.createObjectStore('keyval'); // create an object
  keyValStore.put('world', 'hello'); // put values
  upgradeDb.createObjectStore('people', { keyPath: 'name' });
});

// reading from the db
dbPromise.then(function(db) {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');
  return keyValStore.get('hello');
}).then(function(val) {
  console.log('The value of "hello" is', val);
});

// adding another values into the db
dbPromise.then(function(db) {
   var tx = db.transaction('keyval', 'readwrite');
   var keyValStore = tx.objectStore('keyval');
   keyValStore.put('bar', 'foo');
   return tx.complete;
}).then(function() {
   console.log('Added foo:bar to keyval');
});
*/

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
      const port = 1337; // Change this to your server port
      return `http://localhost:${port}/restaurants`;
  }

  static get PROMISE_RESOLVED() {
      // if the browser doesn't support service worker,
      // we don't care about having a database
      if (!navigator.serviceWorker) {
          return Promise.resolve();
      }

      return idb.open('restaurants', 1, function(upgradeDb) {
          const store = upgradeDb.createObjectStore("restaurants", {
              keyPath: 'id'
          });
      });
  }

  /**
   * Save the property "is_favorite" to DBs when user changed it on the UI
   */
  static fetchFavoriteRestaurant(id, checked) {

      // change value in IndexedDB (cached data)
      DBHelper.PROMISE_RESOLVED.then(db => {
          if (!db) return;
          // get the Restaurant from the JSON (by ID)
          return db.transaction('restaurants')
              .objectStore('restaurants').get(id);
      }).then(obj => {
          let data = obj;
          // change the property for the restaurant
          data.is_favorite = checked;
          DBHelper.PROMISE_RESOLVED.then(db => {
              // and update the record of restaurant
              db.transaction('restaurants','readwrite')
                  .objectStore('restaurants').put(data);
          });
      });

      // change value in DB (raw data on the server)
      fetch(`${DBHelper.DATABASE_URL}/${id}`, {
              method: 'PUT',
              headers: {
                  "Content-Type": "application/json; charset=utf-8",
              },
              body: JSON.stringify({ 'is_favorite' : checked })
          }
      )
          .then((response) => {
              response.json();
          })
          .catch(error => console.error(`Fetch Error =\n`, error));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

      // test if IDB database restaurants contains any data
      DBHelper.PROMISE_RESOLVED.then(db => {
          if (!db) return;

          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          return store.getAll();
      // show all restaurants
      }).then(allRestaurants => {
          // there isn't any restaurant in the idb db
         if (allRestaurants.length === 0) {
             console.log('empty idb db');
             // get restaurant from the server
             fetch(`${DBHelper.DATABASE_URL}`) // from where we pull data
                 .then((response) => {
                     // get the json
                     console.log('get json from the server');
                     return response.json(); // parse the JSON response
                 })
                 // save restaurants into the idb db
                 .then((response) => { // get and start using the returned data
                     console.log('save restaurants into the idb db');
                     const restaurants = response;
                     // the idb db section - make transaction, select store and go through the json to put its data into the idb's store
                     this.PROMISE_RESOLVED.then(db => {
                         const tx = db.transaction('restaurants', 'readwrite');
                         const store = tx.objectStore('restaurants');
                         restaurants.forEach(restaurant => {
                             store.put(restaurant);
                         });
                     });

                     callback(null,restaurants);
                 })
                 .catch((error) => { // for handling with errors
                     callback(error,null)
                 })
         } else {
             // restaurants are stored in the idb db so we use them
             console.log('from the idb db');
             callback(null, allRestaurants);
         }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.

    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

