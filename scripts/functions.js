
var genericSlackFunction = function(options) {
    options = options || {};

    return endpoint.__request(options);
};

var slackFunction = function(path, options, botToken) {
    options = options || {};

    return genericSlackFunction({
        path: path,
        params: options,
        botToken: botToken
    });
};

var downloadFile = function(options, callbackData, callbacks) {
    options = options || {};

    return endpoint.__downloadFile(options, callbackData, callbacks);
};

var respondToSlashCommand = function(url, msg) {
    return endpoint._respondToSlashCommand({responseUrl: url, message: msg});
};

var respondToInteractiveMessage = function(url, msg) {
    return endpoint._respondToInteractiveMessage({responseUrl: url, message: msg});
};

// TODO: OLD Slackbot endpoint: The following functions will be removed in the future
var oldSlackFunction = function(path, options) {
    options = options || {};
    options.doOldConversions = true;

    return slackFunction(path, options);
};

/////////////////////
// Public API
/////////////////////
endpoint.exchangeAppCode = function(options, botToken ){ return slackFunction('oauth.v2.access',options, botToken)};
endpoint.api = {};
endpoint.api.test 		= function(options, botToken){ return slackFunction('api.test', options, botToken) };

endpoint.auth = {};
endpoint.auth.revoke 	= function(options, botToken){ return slackFunction('auth.revoke',    options, botToken) };
endpoint.auth.test 		= function(options, botToken){ return slackFunction('auth.test',      options, botToken) };

endpoint.bots = {};
endpoint.bots.info 		= function(options, botToken){ return slackFunction('bots.info',  options, botToken) };

endpoint.channels = {};
endpoint.channels.archive 	= function(options, botToken){ return slackFunction('channels.archive',		options, botToken) };
endpoint.channels.create 	= function(options, botToken){ return slackFunction('channels.create',		options, botToken) };
endpoint.channels.history 	= function(options, botToken){ return slackFunction('channels.history',		options, botToken) };
endpoint.channels.info 		= function(options, botToken){ return slackFunction('channels.info',			options, botToken) };
endpoint.channels.invite 	= function(options, botToken){ return slackFunction('channels.invite',		options, botToken) };
endpoint.channels.join 		= function(options, botToken){ return slackFunction('channels.join',			options, botToken) };
endpoint.channels.kick 		= function(options, botToken){ return slackFunction('channels.kick',			options, botToken) };
endpoint.channels.leave 	= function(options, botToken){ return slackFunction('channels.leave',			options, botToken) };
endpoint.channels.list 		= function(options, botToken){ return slackFunction('channels.list',			options, botToken) };
endpoint.channels.mark 		= function(options, botToken){ return slackFunction('channels.mark',			options, botToken) };
endpoint.channels.rename 	= function(options, botToken){ return slackFunction('channels.rename',		options, botToken) };
endpoint.channels.replies 	= function(options, botToken){ return slackFunction('channels.replies',		options, botToken) };
endpoint.channels.setPurpose= function(options, botToken){ return slackFunction('channels.setPurpose',	options, botToken) };
endpoint.channels.setTopic 	= function(options, botToken){ return slackFunction('channels.setTopic',		options, botToken) };
endpoint.channels.unarchive = function(options, botToken){ return slackFunction('channels.unarchive',	    options, botToken) };

endpoint.chat = {};
endpoint.chat.delete 		= function(options, botToken){ return slackFunction('chat.delete',		options, botToken) };
endpoint.chat.meMessage 	= function(options, botToken){ return slackFunction('chat.meMessage',		options, botToken) };
endpoint.chat.postMessage 	= function(options, botToken){ return slackFunction('chat.postMessage',	options, botToken) };
endpoint.chat.unfurl 		= function(options, botToken){ return slackFunction('chat.unfurl',		options, botToken) };
endpoint.chat.update 		= function(options, botToken){ return slackFunction('chat.update',		options, botToken) };

endpoint.conversations = {};
endpoint.conversations.archive 	  = function(options, botToken){ return slackFunction('conversations.archive',	options, botToken) };
endpoint.conversations.close 	  = function(options, botToken){ return slackFunction('conversations.close',		options, botToken) };
endpoint.conversations.create 	  = function(options, botToken){ return slackFunction('conversations.create',		options, botToken) };
endpoint.conversations.history 	  = function(options, botToken){ return slackFunction('conversations.history',	options, botToken) };
endpoint.conversations.info 	  = function(options, botToken){ return slackFunction('conversations.info',		options, botToken) };
endpoint.conversations.invite 	  = function(options, botToken){ return slackFunction('conversations.invite',		options, botToken) };
endpoint.conversations.join 	  = function(options, botToken){ return slackFunction('conversations.join',		options, botToken) };
endpoint.conversations.kick 	  = function(options, botToken){ return slackFunction('conversations.kick',		options, botToken) };
endpoint.conversations.leave 	  = function(options, botToken){ return slackFunction('conversations.leave',		options, botToken) };
endpoint.conversations.list 	  = function(options, botToken){ return slackFunction('conversations.list',		options, botToken) };
endpoint.conversations.members 	  = function(options, botToken){ return slackFunction('conversations.members',	options, botToken) };
endpoint.conversations.open 	  = function(options, botToken){ return slackFunction('conversations.open',		options, botToken) };
endpoint.conversations.rename 	  = function(options, botToken){ return slackFunction('conversations.rename',		options, botToken) };
endpoint.conversations.replies 	  = function(options, botToken){ return slackFunction('conversations.replies',	options, botToken) };
endpoint.conversations.setPurpose = function(options, botToken){ return slackFunction('conversations.setPurpose',	options, botToken) };
endpoint.conversations.setTopic   = function(options, botToken){ return slackFunction('conversations.setTopic',	options, botToken) };
endpoint.conversations.unarchive  = function(options, botToken){ return slackFunction('conversations.unarchive',	options, botToken) };

endpoint.dialog = {};
endpoint.dialog.open           = function(options, botToken){ return slackFunction('dialog.open',	options, botToken) };

endpoint.views = {};
endpoint.views.open           = function(options, botToken){ return slackFunction('views.open',	options, botToken) };
endpoint.views.update         = function(options, botToken){ return slackFunction('views.update',	options, botToken) };
endpoint.views.publish        = function(options, botToken){ return slackFunction('views.publish',	options, botToken) };
endpoint.views.push           = function(options, botToken){ return slackFunction('views.push',	options, botToken) };

endpoint.dnd = {};
endpoint.dnd.endDnd 		= function(options, botToken){ return slackFunction('dnd.endDnd',		options, botToken) };
endpoint.dnd.endSnooze 		= function(options, botToken){ return slackFunction('dnd.endSnooze',	options, botToken) };
endpoint.dnd.info 		    = function(options, botToken){ return slackFunction('dnd.info',		options, botToken) };
endpoint.dnd.setSnooze 		= function(options, botToken){ return slackFunction('dnd.setSnooze',	options, botToken) };
endpoint.dnd.teamInfo 		= function(options, botToken){ return slackFunction('dnd.teamInfo',	options, botToken) };

endpoint.emoji = {};
endpoint.emoji.list 		= function(options, botToken){ return slackFunction('emoji.list', options, botToken) };

endpoint.files = {};
endpoint.files.comments = {};
endpoint.files.comments.add 	= function(options, botToken){ return slackFunction('files.comments.add',		options, botToken) };
endpoint.files.comments.delete 	= function(options, botToken){ return slackFunction('files.comments.delete',	options, botToken) };
endpoint.files.comments.edit 	= function(options, botToken){ return slackFunction('files.comments.edit',	options, botToken) };
endpoint.files.delete 		    = function(options, botToken){ return slackFunction('files.delete',			options, botToken) };
endpoint.files.info 		    = function(options, botToken){ return slackFunction('files.info',			    options, botToken) };
endpoint.files.list 		    = function(options, botToken){ return slackFunction('files.list',			    options, botToken) };
endpoint.files.revokePublicURL 	= function(options, botToken){ return slackFunction('files.revokePublicURL',	options, botToken) };
endpoint.files.sharedPublicURL 	= function(options, botToken){ return slackFunction('files.sharedPublicURL',	options, botToken) };
endpoint.files.upload 		    = function(options, botToken){ return slackFunction('files.upload',			options, botToken) };
endpoint.files.download 	    = function(options, callbackData, callbacks){ return downloadFile(options, callbackData, callbacks) };

endpoint.groups = {};
endpoint.groups.archive 	= function(options, botToken){ return slackFunction('groups.archive',		options, botToken) };
endpoint.groups.close 		= function(options, botToken){ return slackFunction('groups.close',		options, botToken) };
endpoint.groups.create 		= function(options, botToken){ return slackFunction('groups.create',		options, botToken) };
endpoint.groups.createChild = function(options, botToken){ return slackFunction('groups.createChild',	options, botToken) };
endpoint.groups.history 	= function(options, botToken){ return slackFunction('groups.history',		options, botToken) };
endpoint.groups.info 		= function(options, botToken){ return slackFunction('groups.info',		options, botToken) };
endpoint.groups.invite 		= function(options, botToken){ return slackFunction('groups.invite',		options, botToken) };
endpoint.groups.kick 		= function(options, botToken){ return slackFunction('groups.kick',		options, botToken) };
endpoint.groups.leave 		= function(options, botToken){ return slackFunction('groups.leave',		options, botToken) };
endpoint.groups.list 		= function(options, botToken){ return slackFunction('groups.list',		options, botToken) };
endpoint.groups.mark 		= function(options, botToken){ return slackFunction('groups.mark',		options, botToken) };
endpoint.groups.open 		= function(options, botToken){ return slackFunction('groups.open',		options, botToken) };
endpoint.groups.rename 		= function(options, botToken){ return slackFunction('groups.rename',		options, botToken) };
endpoint.groups.replies 	= function(options, botToken){ return slackFunction('groups.replies',		options, botToken) };
endpoint.groups.setPurpose 	= function(options, botToken){ return slackFunction('groups.setPurpose',	options, botToken) };
endpoint.groups.setTopic 	= function(options, botToken){ return slackFunction('groups.setTopic',	options, botToken) };
endpoint.groups.unarchive 	= function(options, botToken){ return slackFunction('groups.unarchive',	options, botToken) };

endpoint.im = {};
endpoint.im.close 		= function(options, botToken){ return slackFunction('im.close',	options, botToken) };
endpoint.im.history 	= function(options, botToken){ return slackFunction('im.history',	options, botToken) };
endpoint.im.list 		= function(options, botToken){ return slackFunction('im.list',	options, botToken) };
endpoint.im.mark 		= function(options, botToken){ return slackFunction('im.mark',	options, botToken) };
endpoint.im.open 		= function(options, botToken){ return slackFunction('im.open',	options, botToken) };
endpoint.im.replies 	= function(options, botToken){ return slackFunction('im.replies',	options, botToken) };

endpoint.mpim = {};
endpoint.mpim.close 	= function(options, botToken){ return slackFunction('mpim.close',		options, botToken) };
endpoint.mpim.history 	= function(options, botToken){ return slackFunction('mpim.history',	options, botToken) };
endpoint.mpim.list 		= function(options, botToken){ return slackFunction('mpim.list',		options, botToken) };
endpoint.mpim.mark 		= function(options, botToken){ return slackFunction('mpim.mark',		options, botToken) };
endpoint.mpim.open 		= function(options, botToken){ return slackFunction('mpim.open',		options, botToken) };
endpoint.mpim.replies 	= function(options, botToken){ return slackFunction('mpim.replies',	options, botToken) };

endpoint.oauth = {};
endpoint.oauth.access 	= function(options, botToken){ return slackFunction('oauth.access', options, botToken) };

endpoint.pins = {};
endpoint.pins.add 		= function(options, botToken){ return slackFunction('pins.add',	options, botToken) };
endpoint.pins.list 		= function(options, botToken){ return slackFunction('pins.list',	options, botToken) };
endpoint.pins.remove 	= function(options, botToken){ return slackFunction('pins.remove',options, botToken) };

endpoint.reactions = {};
endpoint.reactions.add 		= function(options, botToken){ return slackFunction('reactions.add',		options, botToken) };
endpoint.reactions.get 		= function(options, botToken){ return slackFunction('reactions.get',		options, botToken) };
endpoint.reactions.list 	= function(options, botToken){ return slackFunction('reactions.list',		options, botToken) };
endpoint.reactions.remove 	= function(options, botToken){ return slackFunction('reactions.remove',	options, botToken) };

endpoint.reminders = {};
endpoint.reminders.add 		= function(options, botToken){ return slackFunction('reminders.add',		options, botToken) };
endpoint.reminders.complete = function(options, botToken){ return slackFunction('reminders.complete',	options, botToken) };
endpoint.reminders.delete 	= function(options, botToken){ return slackFunction('reminders.delete',	options, botToken) };
endpoint.reminders.info 	= function(options, botToken){ return slackFunction('reminders.info',		options, botToken) };
endpoint.reminders.list 	= function(options, botToken){ return slackFunction('reminders.list',		options, botToken) };

endpoint.rtm = {};
endpoint.rtm.start 		= function(options, botToken){ return slackFunction('rtm.start', options, botToken) };
endpoint.rtm.connect 	= function(options, botToken){ return slackFunction('rtm.connect', options, botToken) };

endpoint.search = {};
endpoint.search.all 		= function(options, botToken){ return slackFunction('search.all',		options, botToken) };
endpoint.search.files 		= function(options, botToken){ return slackFunction('search.files',	options, botToken) };
endpoint.search.messages 	= function(options, botToken){ return slackFunction('search.messages',options, botToken) };

endpoint.stars = {};
endpoint.stars.add 		= function(options, botToken){ return slackFunction('stars.add',		options, botToken) };
endpoint.stars.list 	= function(options, botToken){ return slackFunction('stars.list',		options, botToken) };
endpoint.stars.remove 	= function(options, botToken){ return slackFunction('stars.remove',	options, botToken) };

endpoint.team = {};
endpoint.team.accessLogs 	    = function(options, botToken){ return slackFunction('team.accessLogs',		options, botToken) };
endpoint.team.billableInfo 	    = function(options, botToken){ return slackFunction('team.billableInfo',		options, botToken) };
endpoint.team.info 		        = function(options, botToken){ return slackFunction('team.info',			    options, botToken) };
endpoint.team.integrationLogs   = function(options, botToken){ return slackFunction('team.integrationLogs',	options, botToken) };

endpoint.team.profile = {};
endpoint.team.profile.get 	= function(options, botToken){ return slackFunction('team.profile.get', options, botToken) };

endpoint.usergroups = {};
endpoint.usergroups.create 		= function(options, botToken){ return slackFunction('usergroups.create',		options, botToken) };
endpoint.usergroups.disable 	= function(options, botToken){ return slackFunction('usergroups.disable',		options, botToken) };
endpoint.usergroups.enable 		= function(options, botToken){ return slackFunction('usergroups.enable',		options, botToken) };
endpoint.usergroups.list 		= function(options, botToken){ return slackFunction('usergroups.list',		options, botToken) };
endpoint.usergroups.update 		= function(options, botToken){ return slackFunction('usergroups.update',		options, botToken) };
endpoint.usergroups.users = {};
endpoint.usergroups.users.list 	= function(options, botToken){ return slackFunction('usergroups.users.list',	options, botToken) };
endpoint.usergroups.users.update= function(options, botToken){ return slackFunction('usergroups.users.update',options, botToken) };

endpoint.users = {};
endpoint.users.deletePhoto 	= function(options, botToken){ return slackFunction('users.deletePhoto',	options, botToken) };
endpoint.users.getPresence 	= function(options, botToken){ return slackFunction('users.getPresence',	options, botToken) };
endpoint.users.identity 	= function(options, botToken){ return slackFunction('users.identity',		options, botToken) };
endpoint.users.info 		= function(options, botToken){ return slackFunction('users.info',			options, botToken) };
endpoint.users.list 		= function(options, botToken){ return slackFunction('users.list',			options, botToken) };
endpoint.users.lookupByEmail= function(options, botToken){ return slackFunction('users.lookupByEmail',options, botToken) };
endpoint.users.setActive 	= function(options, botToken){ return slackFunction('users.setActive',	options, botToken) };
endpoint.users.setPhoto 	= function(options, botToken){ return slackFunction('users.setPhoto',		options, botToken) };
endpoint.users.setPresence 	= function(options, botToken){ return slackFunction('users.setPresence',	options, botToken) };
endpoint.users.profile = {};
endpoint.users.profile.get 	= function(options, botToken){ return slackFunction('users.profile.get',	options, botToken) };
endpoint.users.profile.set 	= function(options, botToken){ return slackFunction('users.profile.set',	options, botToken) };

// TODO: OLD Slackbot endpoint: The following functions will be removed in the future
endpoint.old = {};
endpoint.old.sendMessage    = function(options, botToken){ return oldSlackFunction('chat.postMessage',options, botToken) };
endpoint.old.channel        = function(options, botToken){ return oldSlackFunction('channels.info',   options, botToken) };
endpoint.old.channels       = function(options, botToken){ return oldSlackFunction('channels.list',   options, botToken) };
endpoint.old.group          = function(options, botToken){ return oldSlackFunction('groups.info',     options, botToken) };
endpoint.old.groups         = function(options, botToken){ return oldSlackFunction('groups.list',     options, botToken) };
endpoint.old.ims            = function(options, botToken){ return oldSlackFunction('im.list',         options, botToken) };
endpoint.old.user           = function(options, botToken){ return oldSlackFunction('users.info',      options, botToken) };
endpoint.old.users          = function(options, botToken){ return oldSlackFunction('users.list',      options, botToken) };
endpoint.old.ping           = function(options, botToken){ return oldSlackFunction('auth.test',       options, botToken) };
endpoint.old.convertEvent   = function(options, botToken) {
    if(!options){
        return options;
    }
    var response = null;
    try {
        var r = endpoint.__convertEvent(options, botToken);
        if(!!r) {
            response = r;
        }
    } catch (e){
        // exception
    }
    return response;
};

// generic functions
endpoint.get = function(options, botToken){ return genericSlackFunction(options, botToken) };
endpoint.post = function(options, botToken){ return genericSlackFunction(options, botToken) };

/////////////////////
// helpers
/////////////////////

endpoint.respondToSlashCommand = respondToSlashCommand;
endpoint.respondToInteractiveMessage = respondToInteractiveMessage;

/////////////////////
// conversions
/////////////////////

endpoint.getTeamName = function(id) {
    if(!id){
        throw 'Team id is empty'
    }
    var response = null;
    try {
        var r = endpoint.__convertTeam({
            key: id
        });
        if(!!r && !!r.value) {
            response = r.value;
        }
    } catch (e){
        // exception
    }
    return response;
};

endpoint.getUserName = function(id) {
    if(!id){
        throw 'User id is empty'
    }
    var response = null;
    try {
        var r = endpoint.__convertUser({
            key: id
        });
        if(!!r && !!r.value) {
            response = r.value;
        }
    } catch (e){
        // exception
    }
    return response;
};

endpoint.getChannelName = function(id) {
    if(!id){
        throw 'Channel id is empty'
    }
    var response = null;
    try {
        var r = endpoint.__convertChannel({
            key: id
        });
        if(!!r && !!r.value) {
            response = r.value;
        }
    } catch (e){
        // exception
    }
    return response;
};

endpoint.getDate = function(timestamp) {
    if(!timestamp){
        throw 'Timestamp is empty'
    }
    var response = null;
    try {
        var r = endpoint.__convertTimestamp({
            key: timestamp
        });
        if(!!r && !!r.value) {
            response = new Date(r.value);
        }
    } catch (e){
        // exception
    }
    return response;
};

