"use strict";

require("dotenv").config();

const Discord = require("discord.js");

const { Bot, Role } = require("simple-bot-discord");
const { MongoDb } = require("simple-bot-discord/modules");

const config = require("./config");
const Logger = require("./modules/Logger");
const NewsFeedAggregator = require("./modules/NewsFeedAggregator");

const bot = new Bot({
  name: "CasualBot",
  commandPrefix: "?",
  optionsPrefix: "--",
  activityMessage: "Welcome to Filthy Casuals!",
  discordToken: process.env.DISCORD_TOKEN
});

//////////////// Modules ////////////////

bot.addModule(new MongoDb({
  databaseUrl: process.env.MONGODB_URI,
  databaseName: process.env.MONGODB_DATABASE_NAME,
  collections: ["logs", "config", "mapleNews"]
}));

bot.addModule(new Logger({
  auditChannelName: "audit"
}));

//////////////// Roles ////////////////

bot.setRoles({
  tryhard: new Role("Tryhard", config.ROLES.TRYHARD, true),
  monkey: new Role("Monkey", config.ROLES.MONKEY, true),
  casual: new Role("Casual", config.ROLES.CASUAL, false),
  degenerate: new Role("Degenerate", config.ROLES.DEGENERATE),
  scrub: new Role("Scrub", config.ROLES.SCRUB),
  pleb: new Role("Pleb", config.ROLES.PLEB)
});

//////////////// Channels ////////////////

bot.setChannels({
  audit: config.CHANNELS.AUDIT,
  goodbye: config.CHANNELS.GOODBYE,
  mapleNews: config.CHANNELS.MAPLE_NEWS,
  test: config.CHANNELS.TEST,
  welcome: config.CHANNELS.WELCOME,
});

//////////////// Admin Commands ////////////////

bot.addCommand("restart", async message => {
  message.channel.send("Restarting...");
  await bot.restart();
  message.channel.send("Successfully restarted!");
}, {
  description: "Restarts the bot",
  requiresRole: bot.roles.tryhard,
  useLogger: true
});

bot.addCommand("purge", async message => {
  const limit = Number(message.tokens[0]) + 1;
  if (!limit) return message.reply("Please specify the number of messages to purge.");
  const messages = await message.channel.fetchMessages({ limit });
  message.channel.bulkDelete(messages);
}, {
  description: "Removes a given number of messages from the current channel.",
  usage: "<number of messages>",
  requiresRole: bot.roles.tryhard
});

const env = bot.addCommand("env", message => {
  message.reply("Please specify which environment variable to get.");
}, {
  description: "Allows interacting with environment variables from the current bot instance.",
  usage: "<get> | <set>",
  requiresRole: bot.roles.tryhard,
  useLogger: true
});

env.addSubCommand("get", message => {
  const variableName = message.tokens[0];
  if (!variableName) message.reply("Please specify a variable name to get.");
  else message.reply(`\`${variableName}\` is currently set to ${JSON.stringify(process.env[variableName])}`);
}, {
  description: "Gets the current value of an environment variable.",
  usage: "<variable name>"
});

env.addSubCommand("set", message => {
  const [variableName, value] = message.tokens;
  if (!variableName) {
    message.reply("Please specify a variable name to set.");
  } else if (!value) {
    message.reply(`Please specify a value to set ${variableName} to.`);
  } else {
    try {
      process.env[variableName] = JSON.parse(value);
    } catch (ignored) {
      process.env[variableName] = value;
    }
    message.reply(`\`${variableName}\` set to ${process.env[variableName]}`);
  }
}, {
  description: "Sets the current value of an environment variable.",
  usage: "<variable name> <value>",
  useLogger: true
});

//////////////// Miscellaneous ////////////////

bot.addCommand("ping", message => {
  message.reply(`pong! I am currently up and running in ${process.env.NODE_ENV} mode.`);
}, {
  description: "Checks whether the bot is online and what mode it is running in."
});

//////////////// Test Commands ////////////////

bot.addCommand("test", message => {
  switch (message.tokens[0]) {
    case "welcome": welcome(message.author); break;
    case "goodbye": goodbye(message.author); break;
    default: return;
  }
});

//////////////// News Feed ////////////////

const mapleNewsAggregator = new NewsFeedAggregator({
  url: config.NEWS_FEED.FEED_URL,
  channelName: "mapleNews",
  newsCollection: "mapleNews",
  crontab: config.NEWS_FEED.FETCH_CRONTAB,
  timezone: config.NEWS_FEED.TIMEZONE,
  bot: bot
}).start();

bot.addCommand("news", _ => mapleNewsAggregator.fetch(), { requiresRole: bot.roles.tryhard });

//////////////// Event Handlers ////////////////

function welcome(member) {
  const message = "Please tag **@Tryhard** or **@Monkey** and post your in-game name here!";
  const embed = new Discord.RichEmbed()
    .setColor(config.WELCOME.EMBED_COLOR)
    .addField(`Welcome to Filthy Casuals!`, message)
    .setThumbnail(config.WELCOME.IMG_URL);
  bot.channels.welcome.send(`Hi ${member}!`);
  bot.channels.welcome.send(embed);
}

function goodbye(member) {
  let message = `${member} has left the server.`;
  if (member.username && member.discriminator) {
    message = `**${member.username}#${member.discriminator}** (${member}) has left the server.`;
  }
  bot.channels.goodbye.send(message);
}

bot.on(Bot.events.guildMemberAdd, welcome);
bot.on(Bot.events.guildMemberRemove, member => bot.channels.goodbye.send(`${member} has left the server.`));
bot.on(Bot.events.ready, () => console.log(`Logged in as ${bot.client.user.tag}!`));

bot.connect();
