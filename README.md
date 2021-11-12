---
title: Slack endpoint
keywords: 
last_updated: April 20, 2017
tags: []
summary: "Detailed description of the API of the Slack endpoint."
---

## Overview

The Slack endpoint supports the following features:

- Shortcuts for web API
- Real time API
- Interactive messages
- Slash commands
- Events API
- Conversations

In most cases data formats and methods available are the same you can find in the 
[Slack API documentation](https://api.slack.com), so we strongly suggest to read it
and understand how it works.

## Configuration

In order to use the Slack endpoint you will need to create a [Slack app](https://api.slack.com/slack-apps).
Depending on the features you need to use from the endpoint you will need to enable different
features in the Slack app:

- **Bot users**: if you want to use bots, you will need to add a bot to your Slack app. That can be
  done from the app page in Slack, in the section `Bot Users`.
- **Slash commands**: if you need slash commands, you have create them in your Slack app. When configuring
  an slash command you will be asked to enter the `Request URL`. This URL is available in the endpoint's
  configuration screen in the field `Slash commands URL`.
- **Interactive messages**: if you need interactive messages, you have to enable that in your Slack app. When
  doing so you will be requested to enter the `Request URL`. This URL is available in the endpoints's
  configuration screen in the field `Interactive messages URL`.
  If you need to support dynamic options in dropdowns, you can also configure the `Options Load URL` here.
- **Events API**: if you need events to be sent over HTTP, you can enable events in your Slack app. You will
  be asked to enter the `Request URL`. This URL is available in the endpoint's configuration screen in the
  field `Events URL`.
  
Other things you need to take into account:

- **Check scopes**: in your Slack app, in the section `OAuth & Permissions`, make sure the following scopes
  are selected:
  - `bot`: needed to use the real time API.
  - `commands`: this is optional and only needed if you want to use slash commands.
  - `chat:write:user`: this is option and only needed if you want to post messages on behalf of a user.
- **Install app on your team**: right from the configuration of your Slack app you will be able to install
  the app on your team. That will provide you the user and bot token, that will be needed during the
  configuration of the endpoint.
- **Events subscriptions**: before enabling this feature you will need to make sure the Slack endpoint is
  already deployed. This is because Slack will check the URL is valid in order to allow to save the URL.
  This means that you will need to create the endpoint, configure basic settings, push changes, make sure
  endpoint is deployed and then you will be able to configure events subscriptions in your Slack app.
  
Below we describe the settings that can be configure for the endpoint.  
  
### Profiles

The Slack endpoint provides three profiles based on how much resources it needs. The more users you have
in your team and more calls are done from your app to the endpoint, the more resources the endpoint will
need.

There are three profiles:

- `Default`: this should be good for most cases. If you have more than 500 users and there are many calls to
  the endpoint you might want to consider using other profile.
- `Medium team`: this is for teams with more than 500 and when there are more calls to the endpoint. More 
  resources will be allocated to handle the load.
- `Big team`: this profile is for big teams (more than 1,000 users) and when you app makes a lot of calls to
  the endpoint.
  
There is no strict rule on which profile you will need. We recommend to start with the `Default` one and move
up as you see you need more resources in your endpoint. You will notice that you need more resources because
when the endpoint has troubles handling the load you will see some errors in the logs saying that there were
problems calling the endpoint.

### User API token

This is the user API token you get when installing your app (`OAuth Access Token` field). This token belongs 
to the user that installed the Slack app and you can use it in the SLINGR app to call the Slack API on behalf 
of this user instead of using the bot. Please check the [Javascript API](#javascript-api) docs below to indicate
which token must be used.

### Bot API token

This is the bot API token you get when installing your app (`Bot User OAuth Access Token` field). This is a bot
token and it has some limitation when using the web API (see [bot methods](https://api.slack.com/bot-users#bot-methods)).
When you use the endpoint you can indicate which token to use, but the bot token is the default one to use.

### Verification token

The verification token is used to validate the slash commands and interactive messages hitting the endpoint. You
will find it in the `Basic information` of your app in the field `Verification Token`.

### Slash commands URL

This is a read-only field and indicates the URL you have to configure in your Slack app to receive slash commands
in your SLINGR app.

### Interactive messages URL

This is a read-only field and indicates the URL you have to configure in your Slack app to receive interactive
messages in your SLINGR app.

### Options load URL

This is a read-only field and indicates the URL you have to configure in your Slack app to be able to provide
custom options in dropdowns. This is configured in the same place where you configure the interactive messages
URL.

### Events URL

This is a read-only field and indicates the URL you have to configure to subscribe to the events API. Keep in mind
that the endpoint has to be deployed before configuring the events API in your Slack app because Slack will make
a test request to validate the URL, which will be valid only when the endpoint is deployed.

## Quick start

Send a message to a channel:

```js
app.endpoints.slack.chat.postMessage({
  channel: '#test',
  text: 'hello!'
});
```

You can see more parameters to send messages [here](https://api.slack.com/methods/chat.postMessage).

You can process an event coming from the RTM API in a listener like this:

```js
if (event.data.type == 'message') {
  var channelName = app.endpoints.slack.getChannelName(event.data.channel);
  var userName = app.endpoints.slack.getUserName(event.data.user);
  var timestamp = app.endpoints.slack.getDate(event.data.ts);
  var text = event.data.text;
  sys.logs.info('On ['+timestamp+'] user ['+userName+'] wrote in channel ['+channelName+']: '+text);
}
```

You can see the full format of messages coming from the RTM API [here](https://api.slack.com/rtm).

## Javascript API

In order to avoid limiting the functionality of the Slack API we have established a one-to-one mapping of the methods
available in the [Slack API](https://api.slack.com/web) and the API of the endpoint. For example the Slack API has the
following URLs:

```
https://slack.com/api/channels.info
https://slack.com/api/channels.list
https://slack.com/api/chat.postMessage
```

For these methods you will find the corresponding ones in the endpoint API:

```js
app.endpoints.slack.channels.info(params);
app.endpoints.slack.channels.list(params);
app.endpoints.slack.chat.postMessage(params);
```

So the patterns is always the followed and the name in the Slack documentation is the same as the name in the endpoint API.

The same happen with parameters. For example the method `channels.list` has the following params:

- `token`
- `exclude_archived`

The `token` is automatically sent by the endpoint, but you can pass other params:

```js
var res = app.endpoints.slack.channels.list({exclude_archived: 'true'});
```

Finally the data format is also the same as indicated in the Slack documentation. This way you can work with the endpoint
by looking at the Slack documentation which is always up-to-date and has all the information your need.

There are a few exceptions that we will describe in the next sections.

### Making calls using the user token

By default all calls are done using the bot token. However bots have some limitations and cannot use some of the methods.
If you need to use the user token, you need to pass an additional parameter to the method named `send_as_user`:

```js
app.endpoints.slack.channels.create({
  send_as_user: true, 
  name: 'newchannel'
});
```

### Uploading files

To upload files you can use the form specified in the Slack documentation for the method `files.upload`. However in this
case you are responsible for sending the content.

In most cases you will have the file uploaded in your SLINGR app and you want to upload it to Slack. To make it simpler
we added a field called `file_id` that allows you to just send the ID of the SLINGR file and it will be uploaded 
automatically:

```js
var res = app.endpoints.slack.files.upload({
        file_id: record.field('attachment').id(),
        filename: record.field('attachment').name(),
        channels: '#test'
});
sys.logs.info('File uploaded: '+response.file.url_private_download);
```

### Downloading files

When you list files on Slack you will get the URL but not the actual file. You will need to download it.

To make this easier we added a method that doesn't exists on the Slack API:

```js
var res = app.endpoints.slack.files.download({
  file_id: 'F4Q26SE0Y', 
  sync: true
}); 

sys.logs.info('File downloaded: ');
sys.logs.info(' - id: '+res.fileId);
sys.logs.info(' - name: '+res.fileName);
sys.logs.info(' - content type: '+res.contentType);

// you can save it in a record field as well
record.field('attachment').val(res.fileId);
```

You could also do the download of the file in an asynchronous way (which is the default):

```js
var res = app.endpoints.slack.files.download({file_id: 'F4Q26SE0Y'}, {record: record}, {
  'fileDownloaded': function(event) {
    sys.logs.info('File downloaded event: ');
    sys.logs.info(' - id: '+event.data.fileId);
    sys.logs.info(' - name: '+event.data.fileName);
    sys.logs.info(' - content type: '+event.data.contentType);
    
    // you can save it in a record field as well
    record.field('attachment').val(res.fileId);
  }
}); 
```

In this case see that the callback follows the rules explained [here](app_development_model_endpoints.html#callbacks).
For this reason in order to use the `record` variable inside the callback function you need to pass it in the
method call.

### Respond to slash commands and interactive messages

There are some helpers to respond to slash commands and interactive messages:

```js
app.endpoints.slack.respondToSlashCommand(responseUrl, message);
app.endpoints.slack.respondToInteractiveMessage(responseUrl, message);
```

The `responseUrl` can be found in the event of slash commands or interactive messages. For example your listener
could be something like this:

```js
var message = {
    response_type: 'ephemeral',
    text: 'test response'
};
app.endpoints.slack.respondToSlashCommand(event.data.response_url, message);
```

### Other helper methods

We provide a few helper methods to make it easier to work with the data coming from the Slack endpoint:

- `getTeamName(id)`: returns the team's name for the given team ID.
- `getUserName(id)`: returns the user's name for the given user ID.
- `getChannelName(id)`: returns the channel's name for the given channel ID.
- `getDate(timestamp)`: converts a timestamp in the Slack format to a `Date` object that you can assign to
  date fields in SLINGR. For example if you get the following event from Slack:
  
  ```js
  {
      "type": "message",
      "ts": "1358878749.000002",
      "user": "U023BECGF",
      "text": "Hello"
  }
  ```
  
  You could convert the date like this:
  
  ```js
  var date = app.endpoints.slack.getDate(event.data.ts);
  record.field('timestamp').val(date);
  ```

### Conversations

The endpoint adds some features on top of the Slack API to make it easier to create conversations. To register a
conversation you need to call the method `convo.registerConvo()`:

```js
app.endpoints.slack.convo.registerConvo(name, patterns, listeners, callback);
```

Where:

- `name`: this is unique name for the conversation.
- `patterns`: indicate which are the messages that will trigger this conversation. You can use simple text or regular
  expressions. For example if you put `hello` it will match when a user writes `hello`.
- `listeners`: apart from matching the pattern, the message must be in some of the places this conversation will be
  listening to. Options are:
  - `mention`: the message will be evaluated against patterns only if it contains a mention to the bot. For
    example if the bot's name is `mybot`, a message will be evaluated if it is something like `save this note @mybot`.
  - `direct_mention`: similar to `mention`, but in this case the mention to the bot should be the first thing in the
    message, like `@mybot save this note`.
  - `direct_message`: messages will be evaluated if they are sent as a direct message to the bot.
  - `ambient`: all messages that the bot can see (based on the channels the bot is in) will be evaluated against the
    patterns.
- `callback`: this is the function called when a message in a valid context (based on `listeners`) matches one of the
  patterns. You will get three parameters:
  - `msg`: this is the message that trigger the event. Here is a sample of this object:
    ```
    {
      text: 'text of the message',
      user_id: 'U82661273',
      user: '<@U82661273>',
      channel_id: 'C89234774',
      channel: '<#C89234774>'
    }
    ```
  - `convo`: this is the conversation object. This is the object you should use to handle the conversation. It has the
    following methods:
    - `say(msg)`: writes something in the conversation. You can send a simple string or a complex Slack message. There
      is one special parameter to replace the previous message like this: `say({text: 'replace original message!, replace: true})`.
    - `ask(msg, callbacks)`: this will print the message and will wait for an interaction with the user (via message or
      button). You can also use the `replace` falg to replace the original message. The list of callbacks have the following
      settings:
      - `patterns`: these are the patterns that have to match to execute this callback. You can use regular expressions
        here and there is a special format for matching buttons which is `button[name=value]`. You can specify many
        patterns in an array.
      - `callback`: this is the function that will be executed if any of the patterns matches. This function can take
        four parameters: 
        - `msg`: the message that matched this callback.
        - `convo`: the conversation object.
        - `data`: the data passed to this callback (see the `data` object below).
        - `event`: the raw Slack event. 
      - `data`: if you want to send some additional data to the callback (it will be passed as a parameter to it), you
        can set something here. For example this is useful if you need to collect information through the conversation.
      - `default`: if `true`, this callback will be called if no one matches. No need to define patterns in this case.
    - `repeat(msg, data)`: repeats the last message, which is useful if the user didn't write a valid message in the 
      conversation. Parameters `msg` and `data` are optional in case you want to change the original question and provide
      different data to callbacks.
    - `stop()`: stops the conversation. It is important to stop conversations when they are completed to avoid resource
      leaks.
  - `event`: the raw Slack event.

Ideally you should register conversations in libraries, where you can organize them as you prefer. However during
development it is also useful to register conversations in the console in the app runtime because you can make changes
to it quickly without having to push changes all the time.

Apart from executing conversations based on patterns, you can manually triggered them:
  
```js
app.endpoints.slack.convo.triggerConvo('conversation-name', channelId, userId);
```

For example if you want to trigger the conversation `hello` every time a channel is created, you could add a listener
to the event `channel_created`:

```js
if (event.data.type == 'channel_created') {
  app.endpoints.slack.convo.triggerConvo('hello', event.data.channel.id, event.data.channel.creator);
}
```

Here is a simple conversation:

```js
app.endpoints.slack.convo.registerConvo('hello', ['hello', '^hi$'], ['direct_mention', 'direct_message'], function(msg, convo) {
  convo.say('hi '+msg.user);
  convo.ask('what do you want to do? [1, 2, 3]', [
    {
      patterns: ['1'],
      callback: function(msg, convo) {
        convo.say('you selected option 1!');
        convo.say('bye!');
        convo.stop();
      }
    },
    {
      patterns: ['2'],
      callback: function(msg, convo) {
        convo.say('you selected option 2!');
        convo.say('bye!');
        convo.stop();
      }
    },
    {
      patterns: ['3'],
      callback: function(msg, convo) {
        convo.say('you selected option 3!');
        convo.say('bye!');
        convo.stop();
      }
    },
    {
      default: true,
      callback: function(msg, convo) {
        convo.say('sorry, i dont understand you');
        convo.repeat();
      }
    }
  ]);
});
```

Here is another conversation with buttons:

```js
app.endpoints.slack.convo.registerConvo('hello', ['hello', '^hi$'], ['direct_mention', 'direct_message'], function(msg, convo) {
  convo.say('hi '+msg.user);
  convo.ask({
      text: 'what do you want to do?',
      attachments: [
        {
            text: "select one option",
            callback_id: "options1",
            color: "#3AA3E3",
            attachment_type: "default",
            actions: [
                {
                    name: "option",
                    text: "1",
                    type: "button",
                    value: "1"
                },
                {
                    name: "option",
                    text: "2",
                    type: "button",
                    value: "2"
                },
                {
                    name: "option",
                    text: "3",
                    type: "button",
                    value: "3"
                }
            ]
        }
      ]
    }, [
    {
      patterns: ['button[option=1]'],
      data: {a: 1, b: 2},
      callback: function(msg, convo, data) {
        convo.say({text: 'you selected option 1!', replace: true, attachments: []});
        convo.say('`'+JSON.stringify(data)+'`');
        convo.stop();
      }
    },
    {
      patterns: ['button[option=2]'],
      data: {a: 2, b: 3},
      callback: function(msg, convo, data) {
        convo.say({text: 'you selected option 2!', replace: true, attachments: []});
        convo.say('`'+JSON.stringify(data)+'`');
        convo.stop();
      }
    },
    {
      patterns: ['button[option=3]'],
      data: {a: 4, b: 5},
      callback: function(msg, convo, data) {
        convo.say({text: 'you selected option 3!', replace: true, attachments: []});
        convo.say('`'+JSON.stringify(data)+'`');
        convo.stop();
      }
    }
  ]);
});
```

You can also use menus and you can match them in callbacks using `select[name=value]`. For example to match if 
the user selected the option `1` in menu `type`:

```js
{
  patterns: ['select[type=1]'],
  callback: function(msg, convo, data) {
    convo.say({text: 'you selected option 1!', replace: true, attachments: []});
    convo.stop();
  }
}
```

It is possible to match any value in the menu using the `*` value:

```js
{
  patterns: ['select[type=*]'],
  callback: function(msg, convo, data) {
    convo.say({text: 'you selected option '+msg.action_value+'!', replace: true, attachments: []});
    convo.stop();
  }
}
```

## Events

### Real time events

If you configure a bot token, the endpoint will send events to the app generated by the [Real Time Messaging API](https://api.slack.com/rtm).

The format of events will be exactly as described in the Slack documentation. This way if in the listener you have
something like this:

```js
sys.logs.info('Event from Slack: '+JSON.stringify(event.data));
```

That will print the same as you see in the Slack documentation.

### HTTP events

These events are generated by the [Events API](https://api.slack.com/events-api). These are almost the same as the
real time events, so it makes no sense to enable both. This could be useful if you don't want a bot in your app and
you just want to use the events API.

The format of events is the same as explained in the Slack documentation, so you should find the same structure
under the `event.data` in your listeners.

### Interactive messages

When a user interacts with messages (for example by clicking in a button) you will get an event in your app. See
the documentation for [Interactive messages](https://api.slack.com/interactive-messages) to learn more about how
they work.

The format of events is the same as explained in the Slack documentation, so you should find the same structure
under the `event.data` in your listeners.

### Options load

This event is sent when Slack needs to fill a dropdown with dynamic options. The content of `event.data` will be
something like this (see [Populate message menus dynamically](https://api.slack.com/docs/message-menus#menu_dynamic)):

```js
{
    "name": "bugs_list",
    "value": "bot",
    "callback_id": "select_remote_1234",
    "team": {
        "id": "T012AB0A1",
        "domain": "pocket-calculator"
    },
    "channel": {
        "id": "C012AB3CD",
        "name": "general"
    },
    "user": {
        "id": "U012A1BCJ",
        "name": "bugcatcher"
    },
    "action_ts": "1481670445.010908",
    "message_ts": "1481670439.000007",
    "attachment_id": "1",
    "token": "verification_token_string"
}
```

When you get that event you need to generate a list of options like this (see more options in 
[Populate message menus dynamically](https://api.slack.com/docs/message-menus#menu_dynamic)):

```js
{
    "options": [
        {
            "text": "Unexpected sentience",
            "value": "AI-2323"
        },
        {
            "text": "Bot biased toward other bots",
            "value": "SUPPORT-42"
        },
        {
            "text": "Bot broke my toaster",
            "value": "IOT-75"
        }
    ]
}
```

And finally once you have the options you need return them using the `return` keyword:

```js
var options = [];
switch (event.data.name) {
    case 'accounts':
        // generate list of accounts
        break;
    case 'bugs':
        // generalte list of bugs
        break;
}
return {options: options};
```

### Slash command

When a user calls a slash command an event of this type will arrive to your app. See the documentation for
[Slash command](https://api.slack.com/slash-commands) to learn more about how they work.

The format of events is the same as explained in the Slack documentation, so you should find the same structure
under the `event.data` in your listeners. Just keep in mind we convert it to a Javascript object. For example if
the message sent by Slack is this:

```
token=gIkuvaNzQIHg97ATvDxqgjtO
team_id=T0001
team_domain=example
channel_id=C2147483705
channel_name=test
user_id=U2147483697
user_name=Steve
command=/weather
text=94070
response_url=https://hooks.slack.com/commands/1234/5678
```

Under `event.data` you will find this:

```js
{
  token: 'gIkuvaNzQIHg97ATvDxqgjtO',
  team_id: 'T0001'
  team_domain: 'example'
  channel_id: 'C2147483705'
  channel_name: 'test'
  user_id: 'U2147483697'
  user_name: 'Steve'
  command: '/weather'
  text: '94070'
  response_url: 'https://hooks.slack.com/commands/1234/5678'
}
```

### File downloaded

This event is generated when you download a file using the method `files.download()` in an asynchronous way.
Usually you won't create a listener for this as in most cases you will handled it as a callback of the method.

The event contains the following fields:

- `event.fileId`: the ID of the file in the app. You can assign it to a file field in a record.
- `event.fileName`: the name of the file that was downloaded.
- `event.contentType`: the MIME type of the file.

For example in a listener you could assign the file to a record like this:

```js
record.field('attachment').val(res.fileId);
sys.data.save(record);
```

## About SLINGR

SLINGR is a low-code rapid application development platform that accelerates development, with robust architecture for integrations and executing custom workflows and automation.

[More info about SLINGR](https://slingr.io)

## License

This endpoint is licensed under the Apache License 2.0. See the `LICENSE` file for more details.
