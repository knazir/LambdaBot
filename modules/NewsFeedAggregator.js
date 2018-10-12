"use strict";

const FeedMe = require("feedme");
const http = require("http");
const urlMetadata = require("url-metadata");

const { CronJob } = require("cron");
const { Module } = require("simple-bot-discord");
const { RichEmbed } = require("discord.js");

module.exports = class NewsFeedAggregator extends Module {
  constructor({ url, channelName, newsCollection, crontab, timezone, bot }) {
    super();
    this._url = url;
    this._channelName = channelName;
    this._newsCollection = newsCollection;
    this._crontab = crontab;
    this._timezone = timezone;
    this._feedParser = this._createFeedParser();
    this._bot = bot;
  }

  getKey() {
    return `${this._url}::${this._channelName}`;
  }

  start() {
    this._cronJob = new CronJob(this._crontab, () => this.fetch(), null, true, this._timezone);
    return this;
  }

  fetch() {
    const res = http.get(this._url, res => {
      res.pipe(this._feedParser);
    });
  }

  _createFeedParser() {
    const parser = new FeedMe(true);
    parser.on("end", async () => {
      const parsedResponse = parser.done();
      if (!parsedResponse || !parsedResponse.items) return;
      for (const item of parsedResponse.items.reverse()) {
        const { title, link, description } = item;
        const metadata = await urlMetadata(link);
        if (await this._isNew(item)) {
          this._postToChannel(this._parseTitle(title), link, description, metadata["og:image"]);
        }
      }
    });
    return parser;
  }

  async _isNew({ title, link }) {
    if (!this._bot.modules.mongodb) return true;
    const existingRecord = await this._bot.modules.mongodb.findInCollection(this._newsCollection, { link });
    if (existingRecord) return false;
    await this._bot.modules.mongodb.addToCollection(this._newsCollection, { title, link });
    return true;
  }

  // TODO: Move this out to make this aggregator more generic
  _parseTitle(item) {
    return item.substring(0, item.indexOf(" | Official MapleStory 2 Website"));
  }

  _postToChannel(title, url, description, thumbnailUrl) {
    const newsItemEmbed = new RichEmbed()
      .setColor(3908860)
      .setTitle(title)
      .setURL(url)
      .setDescription(description);
    if (thumbnailUrl) newsItemEmbed.setThumbnail(thumbnailUrl);
    this._bot.channels[this._channelName].send(newsItemEmbed);
  }
};
