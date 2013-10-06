var eventFetcher = {
  /**
   * Ciklum Community Events page URL that will give us table with local events to parse.
   *
   * @type {string}
   * @private
   */
  _getLocalEventsPageURL: 'http://careers.ciklum.com/join/community/',

    /**
   * Ciklum Community Events page URL that will give us table with world events to parse.
   *
   * @type {string}
   * @private
   */
  //_getLocalEventsPageURL: 'http://www.ciklum.com/pressroom/events/',

  /**
   * Gets html from Ciklum Cummunity Events page and posts it to the main event handler.
   *
   * @constructor
   */
  fetchEvents: function () {
    var _this = this,
        response,
        transport;

    transport= new XMLHttpRequest();
    transport.open('GET', _this._getLocalEventsPageURL, true);
    transport.onreadystatechange = function(){
      if(transport.readyState === 4){
        response = transport.response.replace(/<img[^>]*>/g,'');
        postMessage(response);
      }
    };
    transport.send();
  }
};

// Run fetcher on message
self.onmessage = function() {
  eventFetcher.fetchEvents();
};