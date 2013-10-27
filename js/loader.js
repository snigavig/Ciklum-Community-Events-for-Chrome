var eventPageGenerator = {
    /**
     * Checks if platform is Windows :(
     *
     * @private
     */
    _isWin: function () {
        return navigator.platform.toUpperCase().indexOf('WIN');
    },
  /**
   * Checks if event is outdated.
   *
   * @private
   */
  _isEventOutdated: function (date) {
      return (new Date(date).getTime() < new Date().getTime());
  },
  /**
   * Set local storage value.
   *
   * @private
   */
  _setStorageValue: function (key, value) {
    var content = $('.content'),
        scope = angular.element(content).scope();
    scope.setLocalValue(key, value);
    scope.$apply();
  },
  /**
   * get local storage value
   *
   * @private
   */
  _getStorageValue: function (key) {
    return angular.element($('.content')).scope().getLocalValue(key);
  },
    /**
   * remove local storage value
   *
   * @private
   */
  _removeStorageValue: function (index) {
    angular.bootstrap($('.content'), ['eventsApp']);
    var injector = angular.injector(['ng', 'eventsApp']);
    injector.invoke(['localStorageService', function(localStorageService){
      localStorageService.remove(localStorageService.getKey(index));
    }]);
  },
  /**
   * get local storage values in array
   *
   * @private
   */
  _getStorageArray: function () {
    angular.bootstrap($('.content'), ['eventsApp']);
    var injector = angular.injector(['ng', 'eventsApp']);
    return injector.invoke(['localStorageService', function(localStorageService){
      return localStorageService.getAll();
    }]);
  },
  /**
   * Draws loader.
   *
   * @private
   */
  _drawLoader: function (_this) {
    var html = $('html'),
        body = $('body');
    $('.nano').hide();
    $('.loader').show(100);
      if (0 === _this._isWin()) {
          html.width(140);//fix for chrome's rendering problem
          body.width(140);
          html.height(120);
          body.height(120);
          setTimeout(function () {
              html.height(html.height() + 1);
          }, 100);
      }
  },
    /**
   * Shows content.
   *
   * @private
   */
  _drawContent: function () {
    $('.content').show(100);
  },
    /**
   * Wipes loader.
   *
   * @private
   */
  _wipeLoader: function (_this) {
    var html = $('html');
    $('.loader').hide();
    $('.nano').show();
        if (0 === _this._isWin()) {
            html.width(520);//some more fixes
            html.height(290);
            $('body').height(290);
        }
  },
      /**
   * Shows page
   *
   * @private
   */
  _drawPage: function (_this) {
    if($('.event').length == 0) {
      _this._drawLoader(_this);
      setTimeout(function() { if (!$('.loader').is(':visible')) {_this._drawLoader(_this);} }, 10);
    } else {
      _this._wipeLoader(_this);
      _this._drawContent();
      setTimeout(function() {
        var html = $('html');
            html.width(html.width() + 1);//the final one, wooof. this one is for all platforms
        $('.nano').nanoScroller({ flash: true });
      }, 100);
    }
  },
  /**
   * Starts fetcher.
   *
   * @private
   */
  _fetchEvents: function (_this) {
    var fetcher;

    fetcher = new Worker('js/fetcher.min.js');
    fetcher.postMessage(); // Start worker
    fetcher.addEventListener('message', function(e) {
      fetcher.terminate(); // Terminate worker.
      eventPageGenerator.parseHTML(_this, e.data);
    }, false);
  },
    /**
   * Cleans up past events.
   *
   * @private
   */
  _cleanUpEvents: function (_this) {
    var arr = _this._getStorageArray(),
        i;

    for (i = 0; i < arr.length; i++) {
      if (_this._isEventOutdated(arr[i].date)) {
        _this._removeStorageValue(i);
      }
    }
  },
  /**
   * url -> uniq id
   *
   * @private
   */
  _prepareId: function (id) {
    id = id.replace(/\/join\/community\//, '').replace(/\/$/, '');
    return id;
  },
      /**
   * initialize events controller
   *
   * @private
   */
  _initEventsCtrl: function (_this, eventsApp) {

    eventsApp.controller('EventsCtrl', ['$scope', 'localStorageService', function($scope, localStorageService) {
      $scope.predicate = 'time';
      $scope.init = true;
      $scope.clicked = function(event) {
        chrome.tabs.create({'url': event.cEvent.url});
      };
      $scope.setLocalValue = function(key, value) {
        localStorageService.add(key, value);
      };
      $scope.getLocalValue = function(key) {
          return localStorageService.get(key);
      };
      $scope.getKeyLocalValue = function(index) {
        return localStorageService.getKey(index);
      };
      $scope.getAllLocalValues = function() {
        return localStorageService.getAll();
      };

      if ($scope.init) {
        $scope.cEvents = $scope.getAllLocalValues();
        if($scope.cEvents.length > 0){
          $scope.init = false;
        }
        if($scope.cEvents.length < 7){
          var html = $('html');
          $(function () {
            html.width(html.width() - 10);
          });
        }
      }

      $scope.$on('LocalStorageModule.notification.setItem', function(event, parameters) {
        if ($scope.cEvents.length === 6) {
          var html = $('html');
          $(function () {
            html.width(html.width() + 10);
          });
        }
        $scope.cEvents.push(parameters.communityEvent);
        $scope.cEvents.sort(_this.compareDate);
        if($scope.init){
          _this._wipeLoader(_this);
          _this._drawContent();
          $scope.init = false;
        }
        setTimeout(function() { $('.nano').nanoScroller({ flash: true }); }, 100);
      });
    }]);
  },
  /**
   * Main.
   *
   * @public
   */
  initializePage: function () {
    var _this = this,
        eventsApp = angular.module('eventsApp', ['LocalStorageModule']);

    _this._fetchEvents(_this);
    _this._cleanUpEvents(_this);
    _this._initEventsCtrl(_this, eventsApp);
    $(function() {
      _this._drawPage(_this);
      setTimeout(function() { if (!$('.content').is(':visible')) { _this._drawPage(_this);} }, 10);
    });
  },
  /**
   * HTML parser. Performs simple validation by date. Adds valid objects to localStorage.
   *
   * @public
   */
  parseHTML: function (_this, data) {
    var communityEvent = {},
        table,
        id,
        year,
        date,
        name;

    year = $(data).find('.MonthName span>span').text();
    table = $('.DetailContainerDetailRow', $(data));
    table.each(function() {
      var firstLine,
          secondLine,
          hideName = false;

      id = _this._prepareId(_this.trim( $(this).find('.CommonListStyle a').attr('href') ) );
      date = _this.dateFormatter( year, _this.trim( $(this)
                                    .find('.DetailContainerDateColumn span')
                                    .text()));
      date = new Date(date);
      name = _this.trim( $(this).find('.CommonListStyle div>span').text() );
      firstLine = name.substr(0,41);
      if (name.length > firstLine.length) {
        firstLine = firstLine.substr(0, Math.min(firstLine.length, firstLine.lastIndexOf(' ')));
      }
      secondLine = name.replace(firstLine,'');
      if (secondLine.length > 40){
        hideName = true;
      }

      communityEvent = {
        date: date.toDateString(),
        day: date.getDate(),
        wday: _this.weekdayNames[new Date(date).getDay()],
        time: date.getTime(),
        type: _this.trim( $(this).find('.DetailContainerEventsColumn').text() ),
        url: 'http://careers.ciklum.com/join/community/' + id,
        nameFirstLine: firstLine,
        nameSecondLine: secondLine,
        hideName: hideName,
        location: _this.trim( $(this).find('.DetailContainerLocationColumn').text() )
      };

      if (!_this._isEventOutdated(communityEvent.date) && !_this._getStorageValue(id)) {
        _this._setStorageValue(id, communityEvent);
      }
    });
  },
  /**
   * Weekday names in needed format
   *
   * @public
   */
  weekdayNames : ['sun','mon','tue','wed','thu','fri','sat'],
  /**
   * General-purpose implementation of a trim function
   *
   * @public
   */
  trim: function (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  },
    /**
   * General-purpose implementation of a compare function.
   *
   * @public
   */
  compareDate: function (a,b) {
    if (new Date(a.date).getDate() < new Date(b.date).getDate()) {
      return -1;
    }
    if (new Date(a.date).getDate() > new Date(b.date).getDate()) {
      return 1;
    }
    return 0;
  },
  /**
   * Formats date for Date object
   *
   * @public
   */
  dateFormatter: function (year, daymon) {
    var dateString = daymon.split(/ /),
        date;
    if (dateString.length > 2){
      daymon = dateString[0] + ' ' + dateString[3];
    }
    date = year + ' ' + daymon;
    return date;
  }
};

eventPageGenerator.initializePage();