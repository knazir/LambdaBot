"use strict";

require("dotenv").config();
const Discord = require("discord.js");
const { Bot, Role } = require("simple-bot-discord");

const config = require("./config");
const Logger = require("./modules/Logger");

const bot = new Bot({
  name: "LambdaBot",
  commandPrefix: "?",
  optionsPrefix: "--",
  activityMessage: "Welcome to Lambda!",
  discordToken: process.env.DISCORD_TOKEN
});

//////////////// Modules ////////////////

bot.addModule(new Logger({
  auditChannelName: "audit"
}));

//////////////// Roles ////////////////

bot.setRoles({
  lambda: new Role("Lambda", config.ROLES.LAMBDA, true),
  alpha: new Role("Alpha", config.ROLES.ALPHA, true),
  beta: new Role("Beta", config.ROLES.BETA, false),
  gamma: new Role("Gamma", config.ROLES.GAMMA),
  delta: new Role("Delta", config.ROLES.DELTA),
  intern: new Role("Intern", config.ROLES.INTERN)
});

//////////////// Channels ////////////////

bot.setChannels({
  welcome: config.CHANNELS.WELCOME,
  goodbye: config.CHANNELS.GOODBYE,
  audit: config.CHANNELS.AUDIT
});

//////////////// In-Memory Storage ////////////////

const intervals = new Set();

//////////////// Admin Commands ////////////////

bot.addCommand("restart", async message => {
  message.channel.send("Restarting...");
  await bot.restart();
  message.channel.send("Successfully restarted!");
}, {
  description: "Restarts the bot",
  requiresRole: bot.roles.lambda,
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
  requiresRole: bot.roles.lambda
});

const env = bot.addCommand("env", message => {
  message.reply("Please specify which environment variable to get.");
}, {
  description: "Allows interacting with environment variables from the current bot instance.",
  usage: "<get> | <set>",
  requiresRole: bot.roles.lambda,
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
    default: return;
  }
});

//////////////// Event Handlers ////////////////

function welcome(member) {
  const message = "Please tag **@Lambda** or **@Alpha** and post your in-game name here!";
  const embed = new Discord.RichEmbed()
    .setColor(2215814)
    .addField(`Welcome to Lambda!`, message)
    .setImage(config.WELCOME_IMG_URL);
  bot.channels.welcome.send(`Hi ${member}!`);
  bot.channels.welcome.send(embed);
}

bot.on(Bot.events.guildMemberAdd, welcome);
bot.on(Bot.events.guildMemberRemove, member => bot.channels.goodbye.send(`${member} has left the server.`));
bot.on(Bot.events.ready, () => console.log(`Logged in as ${bot.client.user.tag}!`));

bot.connect();
