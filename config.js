"use strict";

const config = {
  // roles
  ROLES: {
    TRYHARD: "497925024003391489",
    MONKEY: "497925024955629568",
    CASUAL: "497925026763243521",
    DEGENERATE: "497925155612393482",
    SCRUB: "497925156233019402",
    PLEB: "497925156870815754"
  },

  // channels
  CHANNELS: {
    AUDIT: "497940104049065984",
    GOODBYE: "497939386038747147",
    MAPLE_NEWS: "500405143561568276",
    TEST: "497938373483298816",
    WELCOME: "497920448173178880"
  },

  // news feed
  NEWS_FEED: {
    FEED_URL: "http://ftr.fivefilters.org/makefulltextfeed.php?summary=1&content=0&use_extracted_title=1&url=createfeed.fivefilters.org%2Fextract.php%3Furl%3Dmaplestory2.nexon.net%252Fen%252Fnews%26in_id_or_class%3Dnews-item%26url_contains%3D",
    FETCH_CRONTAB: "*/30 * * * *",
    TIMEZONE: "America/Los_Angeles"
  },

  // misc
  WELCOME: {
    EMBED_COLOR: 16030530,
    IMG_URL: "https://i.imgur.com/cosFRv9.png"
  }
};

module.exports = config;
