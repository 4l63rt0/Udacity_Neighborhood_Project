var map, google;


var Place = function(data) {
    this.city = ko.observable(data.city);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
};

function ViewModel() {
    var self = this;

    self.placeList = ko.observableArray([]);
    this.query = ko.observable("");
    self.markers = ko.observableArray([]);

    initialPlaces.forEach(function(placeLocation) {
      self.placeList.push( new Place(placeLocation));
    });

    // Populate infowindow
    this.populateInfoWindow = function(marker, infoWindow) {
      if (infoWindow.marker != marker) {
        infoWindow.marker = marker;
        var $wikiElem = '';
        var cityStr = marker.city;
        var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' +
          cityStr + '&format=json&callback=wikiCallback';
        var wikiRequestTimeOut = setTimeout(function() {
          $wikiElem = 'failed to get wikipedia resources';
        }, 8000);

        $.ajax({
          url: wikiUrl,
          dataType: "jsonp",
          success: function(response) {
            var articleList = response[1];
            for (var i = 0; i < articleList.length; i++) {
              articleStr = articleList[i];
              var url = 'https://en.wikipedia.org/wiki/' + articleStr;
              $wikiElem += '<li><a href="' + url + '">' + articleStr + '</a></li>';
            }
            infoWindow.setContent(self.titleContent + '<hr>' + self.wikiTitle + $wikiElem);
            clearTimeout(wikiRequestTimeOut);
          }
        });
        self.wikiTitle = '<h3>Relevant Wikipedia Links</h3>';
        self.titleContent = '<div>' + marker.city + '<div>';
        infoWindow.open(map, marker);

        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
          marker.setAnimation(null);
        }, 1500 );
        // Cleared infowindow if is closed
        infoWindow.addListener('closeclick', function() {
          infoWindow.marker = null;
        });
      }
    };

    // Handles click selection on map and list
    self.clickSelection = function() {
      self.populateInfoWindow(this, self.largeInfoWindow);
    };

    // Construct Map
    self.initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 24.3001235, lng: -102.2718002},
        zoom: 5,
        styles: mapStyle
      });

      self.largeInfoWindow = new google.maps.InfoWindow();
      // Create array for markers
      for (var i = 0; i < initialPlaces.length; i++) {
        this.city = initialPlaces[i].city;
        this.lat = initialPlaces[i].lat;
        this.lng = initialPlaces[i].lng;
        // create a marker per city
        this.marker = new google.maps.Marker({
          map: map,
          position: {lat: this.lat, lng: this.lng},
          city: this.city,
          icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 5
              },
          id: i,
          animation: google.maps.Animation.DROP,
        });
        this.marker.setMap(map);
        // Push the marker to our array of markers.
        self.markers.push(this.marker);
        this.marker.addListener('click', self.clickSelection);
      }
    };


    this.filter = ko.observable('');


    self.filteredPlaces = ko.computed(function() {
          var filter = self.query().toLowerCase();
          if (!filter) {
          	ko.utils.arrayForEach(self.markers(), function (item) {
              item.setVisible(true);
            });
            return self.markers();
          } else {
            return ko.utils.arrayFilter(self.markers(), function(item) {
              // set all markers visible (false)
              var result = (item.city.toLowerCase().search(filter) >= 0);
              item.setVisible(result);
              return result;
            });
          }
        });

}

ko.applyBindings(ViewModel);

function initMap() {
  var viewmodel = new ViewModel();
  viewmodel.initMap();
}

mapError = function mapError() {
    alert('Please check your internet connection! If problems persists contact your network administrator');
};
