// ----- STEPS -----
// 1. Open Facebook home and get user
// 2. Get external links and pages likes from Facebook
// 3. Send post request to App

// ----- GLOBAL VARIABLES AND FUNCTIONS TO BE CALLED -----
// Global variables
var unpolariseUrl = /(unpolarise\.herokuapp\.com)|(unpolarise\.co\.uk)/;
var facebookUrl = /facebook\.com\/?$/;
var currentUrl = location.href;
var name = ''

// Political Constants
var left = 1.0;
var c_left = 0.25;
var c_right = -0.25;
var right = -1.0;
// Pages
var pages = { "Syriza": {name: "Syriza", source_score: left, url_component: "syrizaofficial"},
              "Melenchon": {name: "Melenchon", source_score: left, url_component: "JLMelenchon"},
              "Corbyn": {name: "Jeremy Corbyn", source_score: left, url_component: "JeremyCorbynMP"},
              "Communist": {name: "Communist Party", source_score: left, url_component: "communism101"},
              "Labour": {name: "Labour Party", source_score: c_left, url_component: "labourparty"},
              "Obama": {name: "Barack Obama", source_score: c_left, url_component: "barackobama"},
              "Sanders": {name: "Bernie Sanders", source_score: c_left, url_component: "berniesanders"},
              "Clinton": {name: "Hillary Clinton", source_score: c_left, url_component: "hillaryclinton"},
              "Sadiq": {name: "Sadiq Khan", source_score: c_left, url_component: "sadiqforlondon"},
              "DailyShow": {name: "Daily Show", source_score: c_left, url_component: "thedailyshow"},
              "Conservative": {name: "Conservative Party", source_score: c_right, url_component: "conservatives"},
              "Cameron": {name: "David Cameron", source_score: c_right, url_component: "DavidCameronOfficial"},
              "Boris": {name: "Boris Johnson", source_score: c_right, url_component: "borisjohnson"},
              "Kyle": {name: "Jeremy Kyle", source_score: c_right, url_component: "Jeremykyle"},
              "LePen": {name: "Marine Le Pen", source_score: right, url_component: "MarineLePen"},
              "Farage": {name: "Nigel Farage", source_score: right, url_component: "nigelfarageofficial"},
              "UKIP": {name: "UKIP", source_score: right, url_component: "UKIP"},
              "BNP": {name: "BNP", source_score: right, url_component: "OfficialBritishNationalParty"},
              "Trump": {name: "Donald Trump", source_score: right, url_component: "DonaldTrump"}
};


/**
 * Function that returns user Facebook full name as displayed
 */
function getUser() {
  while  (name === '' && document.getElementById('u_0_t')) { name = document.getElementById('u_0_t').getElementsByTagName('a')[0].getAttribute("aria-label").replace('Profile of ', '') };
  return name;
};

/**
 * Function that returns user Facebook email
 */
function getEmail() {
// TO DO
};

/**
 * Function that gets external links from Facebook home feed
 */
function getFeed() {
  var elements = document.getElementsByTagName("a");
  var links = [];
  var regexpLinks = /l\.facebook\.com\/l\./;
  for (var i = 0; i < elements.length; i++) {
    var link = (elements[i].getAttribute("href"));
    if (link != null && regexpLinks.exec(link) != null) {links.push(link)};
  };
  return links;
};

/**
 * Function that sends post request to app
 */
function sendFeed(url, message, async, timeStamp) {
  $.ajax({
    type: "POST",
    url: url,
    data: message,
    async: async,
    success: function() {
      /* TODO Delete */ console.log("Wahoooooooooo!!!");
      localStorage[timeStamp] = new Date();
      /* TODO Delete */ console.log("Timestamp saved. All done!");
    },
    error: function(error) {
      console.log("The AJAX request failed with the following:");
      console.log(error.statusText);
    }
  });
};

/**
 * HTTP GET request function for the facebook page
 */
function getEdit(url, done) { //, done
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  // xhr.responseType = 'text'; // document
  // xhr.overrideMimeType('text/xml');
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState == 4) {
      var count = done(xhr.responseText);
    }
  }
  xhr.send();
  return xhr;
}

/**
 * Get the the number of page likes from a Facebook page
 */
function getNumberOfPageLikes(url, done) {
  getEdit(url, function(text) {
    var count = 0;
    var profileUrls = $(text).find('h4:contains("Friends who like this ")').siblings().find('a').map(function () {
      count += 1;
    }).get();
    // console.log("Count: " + count);
    done(count);
    return count;
  });
}

/**
 * Function that calls the others to get a hash which includes the page counts
 */
function createObjectOfPageDetails() {
  Object.keys(pages).forEach( function(key, index) {
    var url = "https://mbasic.facebook.com/" + pages[key].url_component + "/socialcontext";
    // var array = [];
    // Make GET request and count people on page (i.e. the number of friends who have liked)
    getNumberOfPageLikes(url, function(count) {
      pages[key]["friend_likes"] = count;
    });
  });
  return pages;
};


/**
 * Function that checks interval between updates sent to app through AJAX
 */
function checkInterval(timeStamp, interval) { // timeStamp = 'timeStampFeed' || 'timeStampLikes'
  var lastTime = localStorage[timeStamp];
  if (lastTime == null) { return true }
  else { return ((new Date() - lastTime) >= (interval)) } // do (interval * 3600000) to convert to hours
};

// ---------- SCRIPT RUNNING ----------

$(document).ready(function(){
  // Script when active tab is Facebook
  if (facebookUrl.exec(currentUrl)) {
    /* TODO Delete */ console.log("Welcome!");
    name = getUser();
    /* TODO Delete */ console.log("Your Facebook name: " + name);

    // Collecting and sending Facebook home feed (every 2h)
    if (checkInterval('timeStampFeed', 2)) {
      /* TODO Delete */ console.log("Gathering feed data...");
      var urls = getFeed(); // urls is an array
      var feed = {"name": name, "urls": urls};
      /* TODO Delete */ console.log("Data sent for analysis: ");
      /* TODO Delete */ console.log(feed);
      /* TODO Delete */ console.log("Submitting for analysis...");
      var timeStampFeed = new Date();
      sendFeed('https://unpolarise.herokuapp.com/links', feed, true, 'timeStampFeed');
    };

  // Collecting and sending Facebook pages likes (every 240h = 10 days)
    if (checkInterval('timeStampLikes', 10)) {
      console.log("Counting your friends' likes on certain pages.");
      var likes_hash = createObjectOfPageDetails();
      var likes = {"name": name, "likes_array": likes_hash };
      console.log("Data sent for analysis: ");
      console.log(likes);
      // sendFeed('http://testing.unpolarise.ultrahook.com', feed); // For local testing the deployed version
      sendFeed('https://unpolarise.herokuapp.com/facebook_pages', likes, false, 'timeStampLikes');
    };
  };
});

// ----- CHERRY ON THE CAKE -----
// TODO prepend in home feed $('#stream_pagelet').prepend('link to app');
