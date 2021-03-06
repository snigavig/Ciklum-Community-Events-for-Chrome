var angularLocalStorage = angular.module('LocalStorageModule', []);
angularLocalStorage.constant('prefix', 'event_');
angularLocalStorage.constant('notify', { setItem: true } );

angularLocalStorage.service('localStorageService', [
  '$rootScope',
  'prefix',
  'notify',
  function($rootScope, prefix, notify) {

  // add a value to local storage
    var addToLocalStorage = function (key, value) {
      localStorage.setItem(prefix + key, JSON.stringify(value));
      if (notify.setItem) {
        $rootScope.$broadcast('LocalStorageModule.notification.setItem', {key: key, communityEvent: value});
      }
      return true;
    };

    // get a value from local storage
    var getFromLocalStorage = function (key) {
      var item = localStorage.getItem(prefix + key);
      if (item === null) {return false;}
      return JSON.parse(item);
    };

    // Remove an item from local storage
    var removeFromLocalStorage = function (key) {
        localStorage.removeItem(key);
    };

    // get all values from local storage
    var getAllFromLocalStorage = function () {
      var arr = [],
          storedObject,
          i;

      for (i = 0; i < localStorage.length; i++) {
        storedObject = JSON.parse(localStorage.getItem(localStorage.key(i)));
        arr.push(storedObject);
      }
      return arr;
    };

    return {
      add: addToLocalStorage,
      get: getFromLocalStorage,
      remove: removeFromLocalStorage,
      getAll: getAllFromLocalStorage,
    };
  }
]);
