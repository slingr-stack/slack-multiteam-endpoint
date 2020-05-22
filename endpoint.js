((require, process, module) => {
    "use strict"; // ECMAScript 5's strict mode

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Libraries
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    const
        util = require('util'),
        compression = require('compression'),
        express = require('express'),
        bodyParser = require('body-parser'),
        moment = require('moment'),
        requestRetry = require('requestretry'),
        http = require('http'),
        https = require('https'),
        request = require('request'),
        slackClient = require('@slack/client'),
        deAsync = require('deasync'),
        fs = require('fs');

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration from env vars
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // defaults
    const defaults = {
        _endpoint_name: '',
        _app_name: '',
        _pod_id: '',
        _environment : '',
        _local_deployment: 'false',
        _debug: 'true',
        _webservices_port : '10000',
        _token : '',
        _profile : 'default',
        _endpoints_services_api : 'https://endpoints-services/api',
        USE_SSL: false,
        SSL_KEY: '',
        SSL_CERT: '',
        _custom_domain : '',
        _base_domain : 'localhost:8000',
        _endpoint_config : {}
    };

    const settings = Object.assign({}, defaults, process.env);
    const {
        // Endpoint constants
        _endpoint_name:     endpointName,
        _app_name:          applicationName,
        _pod_id:            _podId,
        _environment:       environment,
        _local_deployment:  _localDeployment,
        _debug:             _debug,
        // HTTP services properties
        _webservices_port:  webServicesPort,
        _token:             token,
        _profile:           profile,
        _endpoints_services_api:    endpointsServicesApi,
        USE_SSL:            _useSsl,
        SSL_KEY:            sslKey,
        SSL_CERT:           sslCert,
        // System properties
        _custom_domain:     domainCustom,
        _base_domain:       domainBase,
        // Endpoint specific properties
        _endpoint_config:   _endpoint_config
    } = settings;

    const podId = _podId.length > 5 ? _podId.substring(_podId.length-5): _podId;
    const localDeployment = _localDeployment !== 'false' && !!_localDeployment;
    const debug = _debug !== 'false' && !!_debug;
    const useSsl = !localDeployment || _useSsl;

    // Endpoint specific properties
    const endpointDefaults = {
        userApiToken: '',
        botApiToken: '',
        slashCommandsToken: ''
    };
    const endpointConfig =  Object.assign({}, endpointDefaults, JSON.parse(_endpoint_config));
    const { userApiToken, botApiToken, slashCommandsToken: verificationToken } = endpointConfig;

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Logger configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const formatLog = (level, message) =>
        moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ') + ' comp=endpoint ' +
        'level=' + level + ' ' +
        'podId=' + podId + ' ' +
        'app=' + applicationName + ' ' +
        'endpoint=' + endpointName + ' ' +
        'env=' + environment + ' ' +
        message;
    
    const logDebug = message => {
        if (message && debug) {
            console.log(formatLog('DEBUG', message));
        }
    };

    const logInfo = message => {
        if (message) {
            console.info(formatLog('INFO', message));
        }
    };

    const logWarn = message => {
        if (message) {
            console.warn(formatLog('WARN', message));
        }
    };

    const logError = message => {
        if (message) {
            console.error(formatLog('ERROR', message));
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Basic configuration
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const maskToken = token => {
        if(!token){
            return '-';
        }
        return token.length < 10 ? '.'.repeat(token.length) :
            token.length < 20 ? token.substr(0, 2) + '.'.repeat(token.length - 4) + token.substr(token.length - 2) :
            token.substr(0, 4) + '.'.repeat(token.length - 8) + token.substr(token.length - 4)
    };

    const maskedToken = maskToken(token);

    let cDomain = domainCustom;
    if (cDomain) {
        cDomain = (localDeployment ? 'http' : 'https') + '://' + cDomain
    } else {
        cDomain = (localDeployment ? 'http' : 'https') + '://' + applicationName + '.' + domainBase + '/' + environment
    }
    const domain = cDomain.toLowerCase();
    const secondaryDomain = ((localDeployment ? 'http' : 'https') + '://' + domainBase + '/' + applicationName + '/' + environment).toLowerCase();

    const webhookUrl = domain + '/endpoints/' + endpointName;

    const proto = useSsl ? 'https' : 'http';
    logInfo('Configured endpoint [' + endpointName + ']: '+
        proto + ' [0.0.0.0:' + webServicesPort + '], '+
        'webhook [' + webhookUrl + '], '+
        'token [' + maskedToken + '], '+
        (localDeployment ? ', local deployment' : '')
    );

    logInfo('Configured Endpoint Services - api ['+endpointsServicesApi+']');

    const maskedUserApiToken = maskToken(userApiToken);
    const maskedBotApiToken = maskToken(botApiToken);
    const maskedVerificationToken = maskToken(verificationToken);
    logInfo('Configured Slack endpoint - Slash Commands / Message Interactions: user [' + maskedUserApiToken + '] - bot [' + maskedBotApiToken + '] - verification token [' + maskedVerificationToken + ']');

    const convertException = (err, code) => {
        if (!err) {
            return {
                __endpoint_exception__: true,
                message: 'There is an issue on the endpoint',
                error: !code ? {code: 'general', name: 'General exception'} : code
            }
        } else {
            if (typeof err === 'string') {
                return {
                    __endpoint_exception__: true,
                    message: err,
                    error: !code ? {code: 'general', name: 'General exception'} : code
                }
            } else if (err.__endpoint_exception__) {
                return err
            } else if (err.message) {
                return {
                    __endpoint_exception__: true,
                    message: err.message,
                    additionalInfo: err,
                    error: !code ? {code: 'general', name: 'General exception'} : code
                }
            } else {
                return {
                    __endpoint_exception__: true,
                    message: 'There is an issue on the endpoint',
                    additionalInfo: err,
                    error: !code ? {code: 'general', name: 'General exception'} : code
                }
            }
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // node.js related events
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    process.on('exit', code => logInfo('Endpoint stopped - exit code ['+ code+']'));
    process.on('SIGINT', () => {
        logInfo('Endpoint stopped');
        process.exit(0)
    });
    process.on('beforeExit', code => logInfo('Stopping endpoint - exit code ['+ code+']'));
    process.on('warning', warning => logWarn('Warning ['+util.inspect(warning, { showHidden: true, depth: null })+']'));

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Endpoints services
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const esExecutePost = (path, body, headers) => {
        headers = headers || {};
        if(!headers.token){
            headers.token = token;
        }
        if(!headers.version){
            headers.version = 'v1';
        }

        let options = {
            url: endpointsServicesApi + path,
            headers: headers,
            json: true,
            body: body,
            agentOptions: {
                rejectUnauthorized: false // trust all certs
            },

            // The below parameters are specific to request-retry
            maxAttempts: 10,   // (default) try 5 times
            retryDelay: 5000,  // (default) wait for 5s before trying again
            retryStrategy: requestRetry.RetryStrategies.HTTPOrNetworkError // (default) retry on 5xx or network errors
        };

        return requestRetry.post(options)
            .then(response => response.body)
    };

    const esExecuteGetFile = deAsync((path, fileId, cb) => {
        let filePath = '/tmp/'+fileId+'_'+(Math.floor(Math.random() * 99999));

        let options = {
            url: endpointsServicesApi + path,
            headers: {
                token: token,
                version: 'v1'
            },
            agentOptions: {
                rejectUnauthorized: false // trust all certs
            }
        };

        request(options)
            .on('error', err => {
                let e;
                try {
                    e = JSON.parse(err)
                } catch (ex){
                    e = err
                }
                cb(e, null);
            })
            .on('response', response => {
                if(response.statusCode >= 400){
                    let errs = fs.createReadStream(filePath);
                    let err = '';
                    errs.on('readable', () => {
                        let chunk = errs.read();
                        if(chunk) err += chunk
                    });
                    errs.on('end', () => {
                        let e;
                        try {
                            e = JSON.parse(err)
                        } catch (ex){
                            e = err
                        }
                        cb(e, null);
                    });
                } else {
                    logDebug('Download file from application completed');
                    cb(null, filePath)
                }
            })
            .pipe(fs.createWriteStream(filePath));
    });

    const esExecuteSyncPost = deAsync((path, body, headers, cb) => {
        headers = headers || {};
        if(!headers.token){
            headers.token = token;
        }
        if(!headers.version){
            headers.version = 'v1';
        }

        let options = {
            url: endpointsServicesApi + path,
            headers: headers,
            json: true,
            body: body,
            agentOptions: {
                rejectUnauthorized: false // trust all certs
            },

            // The below parameters are specific to request-retry
            maxAttempts: 10,   // (default) try 5 times
            retryDelay: 5000,  // (default) wait for 5s before trying again
            retryStrategy: requestRetry.RetryStrategies.HTTPOrNetworkError // (default) retry on 5xx or network errors
        };

        request.post(options, (error, response, body) => {
            if (error) {
                logInfo('Error when try to send sync request to app [' + error + ']');
                appLogError('Error when try to send sync request from endpoint to application');

                if(cb){
                    cb(error, null);
                }
            } else {
                if (cb) {
                    cb(null, body)
                }
            }
        });
    });

    const esExecutePostFile = deAsync((path, filePath, cb) => {
        let options = {
            uri: endpointsServicesApi + path,
            headers: {
                token: token,
                version: 'v1'
            }, 
            formData: {
                file: fs.createReadStream(filePath)
            },
            agentOptions: {
                rejectUnauthorized: false // trust all certs
            }
        };

        request.post(options, (error, response, body) => {
            if (error) {
                logInfo('Error when try to upload a file to app [' + error + ']');
                appLogError('Error when try to upload a file from endpoint to application');

                if(cb){
                    cb(error, null);
                }
            } else {
                logDebug('Uploaded file to application');
                if (cb) {
                    cb(null, body)
                }
            }
        });
    });

    // app log (POST /api/endpoints/logs)
    const sendAppLog = (level, message, additionalInfo) => {
        if (!additionalInfo) {
            additionalInfo = {}
        }
        additionalInfo.app = applicationName;
        additionalInfo.endpoint = endpointName;
        additionalInfo.env = environment;

        let appLog = {
            date: parseInt(moment().format("x")),
            level: level,
            message: message,
            additionalInfo: additionalInfo
        };
        esExecutePost('/endpoints/logs', appLog)
            .then(body => logDebug('[APP LOG][' + level + '] ' + appLog.message))
            .catch(error => {
                logDebug('[APP LOG][' + level + '] ' + appLog.message + ' >> [NO SENT]');
                logInfo('Error when try to send app log to ES [' + error + ']')
            })
    };
    const appLogDebug = (message, additionalInfo) => sendAppLog('DEBUG', message, additionalInfo);
    const appLogInfo = (message, additionalInfo) => sendAppLog('INFO', message, additionalInfo);
    const appLogWarn = (message, additionalInfo) => sendAppLog('WARN', message, additionalInfo);
    const appLogError = (message, additionalInfo) => sendAppLog('ERROR', message, additionalInfo);

    let lastStatistic = null;

    // events (POST /api/endpoints/events)
    const sendEvent = (eventName, data, type, fromFunction, sync) => {
        if (!eventName) {
            throw 'Event name is empty'
        }
        if (!data) {
            data = {}
        }
        let eventBody = {
            date: parseInt(moment().format("x")),
            event: eventName,
            data: data
        };
        if(!!fromFunction){
            eventBody.fromFunction = fromFunction;
        }

        let response = null;
        if(!!sync){
            let headers = {
                sync: true
            };

            try {
                response = esExecuteSyncPost('/endpoints/events/sync', eventBody, headers);
                if (response) {
                    try {
                        let json = JSON.parse('' + response);
                        response = json;
                    } catch (e) {
                        logDebug('Error: ' + JSON.stringify(e) + ', response: '+response);
                    }
                    logDebug('[SYNC EVENT][' + eventName + '][type: ' + (type || response.type || '-') + '] >> [SENT]')
                } else {
                    logDebug('[SYNC EVENT][' + eventName + '][type: ' + (type || data.type || '-') + '] >> [SENT] [EMPTY RESPONSE]')
                }
            } catch (e){
                logDebug('[SYNC EVENT][' + eventName + '][type: ' + (type || '-') + '] >> [NO SENT]');
                logInfo('Error when try to send sync event to ES [' + e + ']');
                throw e;
            }
        } else {
            esExecutePost('/endpoints/events', eventBody)
                .then(body => logDebug('[EVENT][' + eventName + '][type: ' + (type || data.type || '-') + '] >> [SENT]'))
                .catch(error => {
                    logDebug('[EVENT][' + eventName + '][type: ' + (type || data.type || '-') + '] >> [NO SENT]');
                    logInfo('Error when try to send event to ES [' + error + ']')
                });
        }

        if(!lastStatistic || moment().subtract(1, 'hour').isAfter(lastStatistic)) {
            lastStatistic = moment();
            logInfo(">>> mem usage: " + util.inspect(process.memoryUsage(), {showHidden: true, depth: null}));
        }

        return response;
    };

    // download a file (GET /endpoints/files/<fileId>)
    const getFileFromApp = fileId => {
        if (!fileId) {
            throw 'Invalid file id';
        }
        return esExecuteGetFile('/endpoints/files/'+fileId, fileId);
    };

    // upload a file (POST /endpoints/files)
    const postFileToApp = filePath => {
        if (!filePath) {
            throw 'Empty file';
        }
        let response = esExecutePostFile('/endpoints/files', filePath);
        if(response && !response.fileId) {
            try {
                let json = JSON.parse('' + response);
                response = json;
            } catch (e) {
                logDebug('Error: ' + JSON.stringify(e))
            }
        }
        return response;
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Conversions: backward compatibility
    // TODO The following functions will be removed in the future
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const _addTimestampValue = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_value');
            if (!message[newKey]) {
                let ts = moment(message[key], "X").format('X');
                if (ts) {
                    message[newKey] = ts;
                    return true
                }

            }
        }
        return false
    };

    const _addTeamName = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_name');
            if (!message[newKey]) {
                let team = cacheDataStore.getTeamById(message[key]);
                if (team) {
                    message[newKey] = team.name;
                    return true
                }
            }
        }
        return false
    };

    const _addUserName = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_name');
            if (!message[newKey]) {
                let user = cacheDataStore.getUserById(message[key]);
                if (user) {
                    message[newKey] = user.name;
                    return true
                }
            }
        }
        return false
    };

    const _addUsersList = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_info');
            if (!message[newKey] && Array.isArray(message[key])) {
                let users = [];
                if(message[key].length > 0) {
                    if (typeof message[key][0] !== 'string') {
                        return false;
                    }
                    for (let userId in message[key]) {
                        let user = cacheDataStore.getUserById(message[key][userId]);
                        if (user) {
                            users.push(user.name)
                        }
                    }
                }
                message[newKey] = users;
                return true
            }
        }
        return false
    };

    const _addChannelName = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_name');
            if (!message[newKey]) {
                let channel = cacheDataStore.getChannelGroupOrDMById(message[key]);
                if (channel) {
                    if (channel.is_im) {
                        let user = cacheDataStore.getUserById(channel.user);
                        if (user) {
                            message[newKey] = '@' + user.name
                        } else {
                            message[newKey] = '@' + channel.user
                        }
                    } else if(channel.is_channel) {
                        message[newKey] = '#'+channel.name
                    } else {
                        message[newKey] = channel.name
                    }
                    return true
                }
            }
        }
        return false
    };

    const _addChannelsList = (message, referenceKey, key, newKey) => {
        if (referenceKey === key) {
            newKey = newKey !== undefined ? newKey : (referenceKey + '_info');
            if (!message[newKey] && Array.isArray(message[key])) {
                let channels = [];
                if(message[key].length > 0) {
                    if (typeof message[key][0] !== 'string') {
                        return false;
                    }
                    for (let channelId in message[key]) {
                        let channel = cacheDataStore.getChannelGroupOrDMById(message[key][channelId]);
                        if (channel) {
                            if (channel.is_im) {
                                let user = cacheDataStore.getUserById(channel.user);
                                if (user) {
                                    channels.push('@' + user.name)
                                } else {
                                    channels.push('@' + channel.user)
                                }
                            } else if (channel.is_channel) {
                                channels.push('#' + channel.name)
                            } else {
                                channels.push(channel.name)
                            }
                        }
                    }
                }
                message[newKey] = channels;
                return true
            }
        }
        return false
    };

    const doConversionsOnMessage = message => {
        for (let i in message) {
            if (message[i] !== null) {
                let executed = false;
                if (Array.isArray(message[i])) {
                    // list of users
                    executed = executed || _addUsersList(message, "members", i);
                    executed = executed || _addUsersList(message, "users", i);

                    // channel list
                    executed = executed || _addChannelsList(message, "channels", i);
                    executed = executed || _addChannelsList(message, "groups", i);
                    executed = executed || _addChannelsList(message, "ims", i);
                    executed = executed || _addChannelsList(message, "pinned_to", i);

                    if (!executed) {
                        //going on step down in the object tree!!
                        doConversionsOnMessage(message[i])
                    }
                } else if (typeof(message[i]) == "object") {
                    //going on step down in the object tree!!
                    doConversionsOnMessage(message[i])
                } else {
                    // team name
                    executed = executed || _addTeamName(message, "team", i);
                    executed = executed || _addTeamName(message, "team_id", i, "team_name");

                    // user name
                    executed = executed || _addUserName(message, "user", i);
                    executed = executed || _addUserName(message, "inviter", i);
                    executed = executed || _addUserName(message, "creator", i);
                    executed = executed || _addUserName(message, "user_id", i, "user_name");

                    // list of users
                    executed = executed || _addUsersList(message, "members", i);
                    executed = executed || _addUsersList(message, "users", i);

                    // timestamps
                    executed = executed || _addTimestampValue(message, "ts", i);
                    executed = executed || _addTimestampValue(message, "event_ts", i);
                    executed = executed || _addTimestampValue(message, "deleted_ts", i);
                    executed = executed || _addTimestampValue(message, "last_read", i);
                    executed = executed || _addTimestampValue(message, "last_set", i);
                    executed = executed || _addTimestampValue(message, "latest", i);

                    // channel name
                    executed = executed || _addChannelName(message, "channel", i);
                    executed = executed || _addChannelName(message, "channel_id", i, "channel_name");

                    // channel list
                    executed = executed || _addChannelsList(message, "channels", i);
                    executed = executed || _addChannelsList(message, "groups", i);
                    executed = executed || _addChannelsList(message, "ims", i);
                    executed = executed || _addChannelsList(message, "pinned_to", i)
                }
            }
        }
        return message
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Slack functionality
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const RTM_API_EVENT_ARRIVED = 'eventArrived';
    const EVENT_API_EVENT_ARRIVED = 'httpEventArrived';
    const SLASH_COMMAND = 'slashCommand';
    const INTERACTIVE_MESSAGE = 'interactiveMessage';
    const OPTIONS_LOAD = 'optionsLoad';
    const FILE_DOWNLOADED = 'fileDownloaded';

    /////////////////////
    // configuration clients
    /////////////////////

    const cacheDataStore = new slackClient.MemoryDataStore();

    const web = new slackClient.WebClient(botApiToken, {
        // Sets the level of logging we require
        logLevel: 'debug'
    });

    const userWeb = userApiToken ? new slackClient.WebClient(userApiToken, {
        // Sets the level of logging we require
        logLevel: 'debug'
    }) : null;

    const rtm = new slackClient.RtmClient(botApiToken, {
        // Sets the level of logging we require
        logLevel: 'warning',
        // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
        dataStore: cacheDataStore
    });

    /////////////////////
    // functions
    /////////////////////

    // generic call to the web api
    const _slackRequest = (endpoint, data, cb) => {
        data = data || {};
        if (userWeb && !!data.send_as_user) {
            userWeb._makeAPICall(endpoint, data, null, (err, msg) => {
                if(!!err){
                    cb({
                        __endpoint_exception__: true,
                        message: 'Error returned by the Slack API'+(!!err ? ': '+(!!err.message ? err.message : err):''),
                        additionalInfo: msg,
                        error: {code: 'apiException', name: 'API exception'}
                    }, msg);
                } else {
                    if(!msg.ok){
                        cb({
                            __endpoint_exception__: true,
                            message: 'Error returned by the Slack API: '+msg.error,
                            additionalInfo: msg,
                            error: {code: 'apiException', name: 'API exception'}
                        }, msg);
                    } else {
                        cb(null, msg)
                    }
                }
            })
        } else {
            web._makeAPICall(endpoint, data, null, (err, msg) => {
                let newError = null;
                if(!!err){
                    newError = {
                        __endpoint_exception__: true,
                        message: 'Error returned by the Slack API' + (!!err ? ': ' + (!!err.message ? err.message : err) : ''),
                        additionalInfo: !!msg ? msg : {},
                        error: {code: 'apiException', name: 'API exception'}
                    }
                } else {
                    if(!msg.ok){
                        newError = {
                            __endpoint_exception__: true,
                            message: 'Error returned by the Slack API: '+msg.error,
                            additionalInfo: !!msg ? msg : {},
                            error: {code: 'apiException', name: 'API exception'}
                        };
                    }
                }

                if(!!newError){
                    cb(newError, null)
                } else {
                    cb(null, msg)
                }
            })
        }
    };
    const _syncSlackRequest = deAsync(_slackRequest);

    // call to upload a file to the web api
    const _slackRequestUploadFile = (data, filePath, cb) => {
        data = data || {};
        data.file = fs.createReadStream(filePath);

        if (userWeb && !!data.send_as_user) {
            userWeb.files.upload(filePath, data, cb);
        } else {
            web.files.upload(filePath, data, cb);
        }
    };
    const _syncSlackRequestUploadFile = deAsync(_slackRequestUploadFile);

    const downloadFileFromApplication = (functionName, fileId) => {
        logDebug('[FUNCTION]['+functionName+'] Downloading file from application [' + fileId + ']');
        let response = null;
        try {
            response = getFileFromApp(fileId);
            logDebug('[FUNCTION]['+functionName+'][download file][' + fileId + ']  >> [' + (!!response ? '' : 'NO ') + 'DOWNLOADED]');
        } catch(error) {
            logDebug('[FUNCTION]['+functionName+'][download file][' + fileId + '] >> [NO DOWNLOADED]');
            logInfo('Error when try to read file from app runtime [' + JSON.stringify(error) + ']');

            appLogError('Error when endpoint try to read file [' + fileId + ']', {error: error});
            throw error;
        }
        return response;
    };

    const genericSlackRequest = data => {
        if (!data || !data.path) {
            throw 'Empty path'
        }
        let path = data.path;
        logDebug('[FUNCTION] Executing function request to [' + path + ']');

        let params = data.params || data.body || {};
        let response = null;
        if(path === 'files.upload' && !!params.file_id){
            // download the file from application before to send to slack
            let file = downloadFileFromApplication(path, params.file_id);
            if(file) {
                params.file_id = null;
                response = _syncSlackRequestUploadFile(params, file);
            }
        } else {
            response = _syncSlackRequest(path, params);
        }
        if (!!params.doOldConversions) {
            response = doConversionsOnMessage(response);
        }
        return response;
    };

    const asyncDownloadFile = (fileId, fromFunction, cb) => {
        if (!fileId) {
            throw 'Empty file id'
        }
        // find url
        let url = null;
        let filename = null;
        let error = false;

        if(fileId){
            let file = genericSlackRequest({path: 'files.info', params:{file: fileId}});
            if(!file.ok){
                error = file.error ? file.error : 'Error when try to retry file information';
            } else {
                if (file.file && fileId == file.file.id) {
                    url = file.file.url_private_download;
                    filename = file.file.name;
                } else {
                    error = 'File not found';
                }
            }
        }
        if (error) {
            throw error
        }
        if (!url) {
            throw 'Url not found'
        }
        let options = {
            url: url,
            headers: {
              'Authorization': 'Bearer '+botApiToken
            }
        };

        let filePath = '/tmp/'+(Math.floor(Math.random() * 99999))+'_'+(filename?filename:'file');
        request(options)
            .on('error', err => {
                appLogError('Error when download file '+(filename?'['+filename+'] ':'')+'['+url+']');
                logWarn('Error when download file: '+JSON.stringify(err));
                if(cb){
                    cb(err, null);
                }
            })
            .on('response', response => {
                if(response.statusCode >= 400){
                    let errs = fs.createReadStream(filePath);
                    let err = '';
                    errs.on('readable', () => {
                        let chunk = errs.read();
                        if(chunk) err += chunk
                    });
                    errs.on('end', () => {
                        let e;
                        try {
                            e = JSON.parse(err)
                        } catch (ex){
                            e = err
                        }
                        appLogError('Error when try to download file ['+url+']: '+JSON.stringify(err));
                        if(cb) {
                            cb(e, null);
                        }
                    });
                } else {
                    logDebug('Download file from Slack completed');

                    // wait to download
                    let file = fs.createReadStream(filePath);
                    file.on('readable', () => {
                        file.read();
                    });
                    file.on('end', () => {
                        let file = {};

                        // upload to application
                        let appFile = postFileToApp(filePath);
                        if (appFile && appFile.fileId) {
                            file = {
                                fileId: appFile.fileId,
                                contentType: appFile.contentType,
                                fileName: appFile.fileName
                            };

                            // send event - callback
                            if (fromFunction) {
                                sendEvent(FILE_DOWNLOADED, file, appFile.fileId, fromFunction)
                            }
                        }

                        if (cb) {
                            cb(null, file)
                        }
                    })
                }
            })
            .pipe(fs.createWriteStream(filePath));
    };
    const syncDownloadFile = deAsync(asyncDownloadFile);

    const genericDownloadRequest = (data, fromFunction) => {
        if (!data || !data.file_id) {
            throw 'Empty file id'
        }
        let fileId = data.file_id;
        let sync = !!data.sync;
        logDebug('[FUNCTION] Downloading file [' + fileId + ']'+(sync?' SYNC':''));

        let response = {body: 'ok'};
        if(!!data.fullResponse){
            response.fullResponse = true;
        }
        if(sync){
            // sync download
            response = syncDownloadFile(fileId, null);
        } else {
            // async download
            asyncDownloadFile(fileId, fromFunction);
        }
        return response;
    };

    const responseUrlRequest = data => {
        if (!data || !data.responseUrl) {
            throw 'Empty response url'
        }
        let options = {
            url: data.responseUrl,
            json: true,
            body: data.message || {}
        };

        requestRetry.post(options)
            .then(response => logInfo("Executed slack request to URL ["+data.responseUrl+"]"))
            .catch(reason => logWarn("Exception when executes slack command: " + util.inspect(reason, { showHidden: true, depth: null })))
    };

    const conversionRequest = (functionName, data) => {
        if (!data || !data.key) {
            throw 'Empty key'
        }
        let key = data.key;
        let value = null;
        if(functionName == '__convertTeam'){
            let team = cacheDataStore.getTeamById(key);
            if (team) {
                value = team.name;
            }
        } else if(functionName == '__convertUser'){
            let user = cacheDataStore.getUserById(key);
            if (user) {
                value = user.name;
            }
        } else if(functionName == '__convertChannel'){
            let channel = cacheDataStore.getChannelGroupOrDMById(key);
            if (channel) {
                if (channel.is_im) {
                    let user = cacheDataStore.getUserById(channel.user);
                    if (user) {
                        value = '@' + user.name
                    } else {
                        value = '@' + channel.user
                    }
                } else if(channel.is_channel) {
                    value = '#'+channel.name
                } else {
                    value = channel.name
                }
            }
        } else if(functionName == '__convertTimestamp'){
            let ts = moment(key, "X").format('X');
            if (ts) {
                value = parseInt(ts)*1000;
            }
        } else {
            throw 'Invalid conversion: '+functionName
        }
        return {key: key, value: value}
    };

    const conversionObjectRequest = (functionName, data) => {
        data = data || {};
        let response = null;
        if(functionName == '__convertEvent'){
            response = doConversionsOnMessage(data);
        }
        return response;
    };


    const genericEndpointFunctions = [
        '__request',	// Sends a POST request
        'get',
        'post'
    ];

    const genericDownloadFunctions = [
        '__downloadFile'
    ];

    const commandEndpointFunctions = [
        '_respondToSlashCommand'  // Responds to a slash command
    ];

    const interactiveMessagesEndpointFunctions = [
        '_respondToInteractiveMessage'  // Responds to an interactive message
    ];

    const commandConversionFunctions = [
        '__convertTeam',
        '__convertUser',
        '__convertChannel',
        '__convertTimestamp'
    ];

    const commandConversionObjectFunctions = [
        '__convertEvent'
    ];

    /////////////////////
    // Real Time Messages: Real time events
    /////////////////////

    const processReceivedEvent = message => sendEvent(RTM_API_EVENT_ARRIVED, message);

    rtm.on(slackClient.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
        logInfo('Slack RTM connection open');

        // send 'hello' to app
        processReceivedEvent({type: "hello"})
    });

    rtm.on(slackClient.CLIENT_EVENTS.RTM.DISCONNECT, () =>
        appLogError('Slack client has disconnected and will not try to reconnect again automatically. Please check your configuration and restart the endpoint.')
    );

    // subscribe to RTM events
    for (let eventName in slackClient.RTM_EVENTS) {
        if (eventName != 'USER_TYPING' && eventName != 'RECONNECT_URL') {
            if(slackClient.RTM_EVENTS.hasOwnProperty(eventName)) {
                rtm.on(slackClient.RTM_EVENTS[eventName], processReceivedEvent)
            }
        }
    }

    rtm.start();

    /////////////////////
    // Events API: Http events
    /////////////////////

    const processReceivedHttpEvent = message => sendEvent(EVENT_API_EVENT_ARRIVED, message.event, message && message.event ? message.event.type : null);

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // HTTP service: Webhook
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    const webhookRouter = express.Router();

    // process event api events
    webhookRouter.post('/events', (req, res) => {
        // check token
        let validToken = false;
        let body = req && req.body ? req.body : {};
        if (body.token && verificationToken === body.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            validToken = true
        }
        if (validToken) {
            if(body.type === 'url_verification'){
                res.send({ challenge: body.challenge });
            } else {
                processReceivedHttpEvent(body);
                res.send({ text: 'ok /events' })
            }
        } else {
            logWarn("Invalid token on incoming event");
            res.status(401).send('Invalid token')
        }
    });

    // process slash commands
    webhookRouter.post('/slashCommands', (req, res) => {
        // check token
        let validToken = false;
        let body = req && req.body ? req.body : {};
        if (body.token && verificationToken === body.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            validToken = true
        }
        if (validToken) {
            sendEvent(SLASH_COMMAND, body, body.command);
            res.send()
        } else {
            logWarn("Invalid token on incoming slash command");
            res.status(401).send('Invalid token')
        }
    });

    // process interactive messages
    webhookRouter.post('/interactiveMessages', (req, res) => {
        // check payload
        let payload = {};
        if(req.body && req.body.payload) {
            payload = JSON.parse(''+req.body.payload);
        }
        if(Object.keys(payload).length !== 0){
            // check token
            let validToken = false;
            if (payload.token && verificationToken === payload.token) {
                validToken = true
            }
            if(!validToken && localDeployment){
                // if the endpoint is running in local environment, pass token validation
                validToken = true
            }
            if (validToken) {
                sendEvent(INTERACTIVE_MESSAGE, payload, payload.callback_id);
                res.send()
            } else {
                logWarn("Invalid token on incoming interactive messages");
                res.status(401).send('Invalid token')
            }
        } else {
            logWarn("Invalid payload on incoming interactive messages");
            res.status(401).send('Invalid payload')
        }
    });

    // process options load requests
    webhookRouter.post('/optionsLoad', (req, res) => {
        // check payload
        let payload = req.body;
        if(req.body && req.body.payload) {
            payload = JSON.parse(''+req.body.payload);
        }
        // check token
        let validToken = false;
        if (payload.token && verificationToken === payload.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            validToken = true
        }
        if(!validToken){
            logWarn("Invalid verification token");
            res.status(401).send('Invalid token');
            return {};
        }
        if (payload.ssl_check) {
            res.send({});
            return {};
        }

        let options;
        try {
            options = sendEvent(OPTIONS_LOAD, payload, null, null, true);
        } catch (ex){
            appLogError("There was an error loading options: " + JSON.stringify(ex));
            options = [];
        }
        res.send(options);
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // HTTP service: Endpoint API
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    appLogInfo('Endpoint ['+endpointName+'] is being initialized');

    const apiRouter = express.Router();

    let firstLocalDeploymentWarning = false;

    // Health check
    apiRouter.get('/system/alive', (req, res) => {
        let validToken = false;
        if (req.headers && req.headers.token && token === req.headers.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            if(!firstLocalDeploymentWarning) {
                firstLocalDeploymentWarning = true;
                logWarn("Invalid or empty token on request. Ignored exceptions of this kind because the endpoint is running in local deployment.");
            }
            validToken = true
        }
        if (validToken) {
            res.send({started: true});
        } else {
            logInfo("Invalid token when try to check health");
            res.status(401).send('Invalid token')
        }
    });

    // Termination
    apiRouter.get('/system/terminate', (req, res) => {
        let validToken = false;
        if (req.headers && req.headers.token && token === req.headers.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            if(!firstLocalDeploymentWarning) {
                firstLocalDeploymentWarning = true;
                logWarn("Invalid or empty token on request. Ignored exceptions of this kind because the endpoint is running in local deployment.");
            }
            validToken = true
        }
        if (validToken) {
            logInfo('Stopping endpoint [' + endpointName + ']...');
            res.send('ok');
            process.exit(0)
        } else {
            logInfo("Invalid token when try to terminate process");
            res.status(401).send('Invalid token')
        }
    });

    // process functions
    apiRouter.post('/function', (req, res) => {
        let validToken = false;
        if (req.headers && req.headers.token && token === req.headers.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            if(!firstLocalDeploymentWarning) {
                firstLocalDeploymentWarning = true;
                logWarn("Invalid or empty token on request. Ignored exceptions of this kind because the endpoint is running in local deployment.");
            }
            validToken = true
        }
        let response = null;
        let responseCode = 200;
        if (validToken) {
            try {
                let body = req.body || {};
                let functionName = body.function;

                if (!functionName) {
                    response = convertException('Empty function name', {code: 'argumentException', name: 'Argument invalid'});
                    responseCode = 404;
                } else {
                    let params = body.params || body.body || {};

                    if (genericEndpointFunctions.indexOf(functionName) >= 0) {
                        // get response
                        response = genericSlackRequest(params)
                    } else {
                        if(genericDownloadFunctions.indexOf(functionName) >= 0) {
                            // download response
                            response = genericDownloadRequest(params, body.id)
                        } else {
                            if (commandEndpointFunctions.indexOf(functionName) >= 0) {
                                // slash commands function
                                logDebug('[FUNCTION][slash command] executing slash command response');
                                responseUrlRequest(params);
                                response = {}
                            } else {
                                if (interactiveMessagesEndpointFunctions.indexOf(functionName) >= 0) {
                                    // interactive messages function
                                    logDebug('[FUNCTION][interactive message] executing interactive messages response');
                                    responseUrlRequest(params);
                                    response = {}
                                } else {
                                    if (commandConversionFunctions.indexOf(functionName) >= 0) {
                                        // conversion functions
                                        response = conversionRequest(functionName, params);
                                    } else {
                                        if (commandConversionObjectFunctions.indexOf(functionName) >= 0) {
                                            // conversion object functions
                                            response = conversionObjectRequest(functionName, params);
                                        } else {
                                            // invalid function
                                            response = convertException('Function [' + functionName + '] is not defined for the endpoint', {code: 'argumentException', name: 'Argument invalid'});
                                            responseCode = 404;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                if(!!err && !!err.message) {
                    if(!!err.__endpoint_exception__) {
                        response = convertException(err)
                    } else {
                        response = convertException(err.message)
                    }
                } else {
                    err = util.inspect(err, {showHidden: true, depth: null});
                    if(!!err && err.startsWith("'") && err.endsWith("'")){
                        err = err.substring(1, err.length - 1);
                    }
                    response = convertException(err);
                }
                responseCode = 500;
            }
            if (!response) {
                response = convertException("Empty endpoint response");
                responseCode = 400;
            }

            res.status(responseCode).send({
                date: parseInt(moment().format("x")),
                data: response
            })
        } else {
            logInfo("Invalid token when try to execute function request");
            res.status(401).send('Invalid token')
        }
    });

    // get configuration
    apiRouter.get('/configuration', (req, res) => {
        logInfo("Configuration request");
        let validToken = false;
        if (req.headers && req.headers.token && token === req.headers.token) {
            validToken = true
        }
        if(!validToken && localDeployment){
            // if the endpoint is running in local environment, pass token validation
            if(!firstLocalDeploymentWarning) {
                firstLocalDeploymentWarning = true;
                logWarn("Invalid or empty token on request. Ignored exceptions of this kind because the endpoint is running in local deployment.");
            }
            validToken = true
        }
        let response = null;
        if (validToken) {
            try {
                let json = JSON.parse(fs.readFileSync('./endpoint.json', 'utf8'));
                if (json) {
                    response = {
                        app: applicationName,
                        name: endpointName,
                        env: environment,
                        perUser: false,
                        configuration: {
                            _endpoint_name: endpointName,
                            _app_name: applicationName,
                            _pod_id: podId,
                            _environment: environment,
                            _local_deployment: localDeployment,
                            _custom_domain: domainCustom,
                            _base_domain: domainBase,
                            _webservices_port: webServicesPort,
                            _debug: debug,
                            _token: '-',
                            _profile: profile,
                            _endpoints_services_api: endpointsServicesApi,
                            _endpoint_config: {
                                botApiToken: botApiToken,
                                userApiToken: userApiToken,
                                slashCommandsToken: verificationToken
                            }
                        },
                        js: '',
                        listeners: '',
                        functions: [],
                        events: []
                    };

                    if(!!json.configurationHelpUrl){
                        response.configurationHelpUrl = json.configurationHelpUrl;
                    }
                    if(!!json.functions){
                        response.functions = json.functions;
                    }
                    if(!!json.events){
                        response.events = json.events;
                    }
                    if(!!json.configuration){
                        response.conf = json.configuration;
                    }
                    if(!!json.userConfiguration){
                        response.userConf = json.userConfiguration;
                    }
                    if(!!json.userConfigurationButtons){
                        response.userConfButtons = json.userConfigurationButtons;
                    }
                    if(!!json.scripts){
                        let scripts = '';
                        for(let i in json.scripts){
                            let fileContent = fs.readFileSync('./scripts/'+json.scripts[i], 'utf8');
                            if(fileContent){
                                try {
                                    scripts += '\n/* */\n';
                                    scripts += fileContent;
                                    scripts += '\n/* */\n';
                                } catch (err){
                                    logWarn('JS file ['+json.scripts[i]+'] can not be read: '+convertException(err));
                                }
                            }
                        }
                        response.js = scripts;
                    }
                    if(!!json.listeners){
                        let listeners = '';
                        for(let i in json.listeners){
                            let fileContent = fs.readFileSync('./listeners/'+json.listeners[i], 'utf8');
                            if(fileContent){
                                try {
                                    listeners += '\n/* */\n';
                                    listeners += fileContent;
                                    listeners += '\n/* */\n';
                                } catch (err){
                                    logWarn('Listeners file ['+json.listeners[i]+'] can not be read: '+convertException(err));
                                }
                            }
                        }
                        response.listeners = listeners;
                    }
                } else {
                    logInfo("Empty metadata file when try to execute configuration request");
                    response = convertException('Empty metadata file')
                }
            } catch (err) {
                if(err && err.message) {
                    response = convertException(err.message)
                } else {
                    err = util.inspect(err, {showHidden: true, depth: null});
                    if(err && err.startsWith("'") && err.endsWith("'")){
                        err = err.substring(1, err.length - 1);
                    }
                    response = convertException(err)
                }
            }
            if (!response) {
                response = convertException("Empty endpoint response")
            }
            logInfo("Configuration response from endpoint");
            res.send(response)
        } else {
            logInfo("Invalid token when try to get configuration");
            res.status(401).send('Invalid token')
        }
    });

    const webServicesServer = express();
    webServicesServer.use(compression());
    webServicesServer.use(bodyParser.urlencoded({extended: true})); // configure app to use bodyParser()
    webServicesServer.use(bodyParser.json()); // this will let us get the data from a POST
    webServicesServer.use('/api', apiRouter); // all of our routes will be prefixed with /api
    webServicesServer.use('/', webhookRouter); // all of our routes will be prefixed with nothing
    if (useSsl) {
        // start https service
        const sslCredentials = {
            key: sslKey,
            cert: sslCert
        };
        https.createServer(sslCredentials, webServicesServer).listen(webServicesPort, function () {
            logInfo('Https service ready on port [' + webServicesPort + ']');
        });
    } else {
        // start http service
        http.createServer(webServicesServer).listen(webServicesPort, function () {
            logInfo('Http service ready on port [' + webServicesPort + ']');
        });
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Endpoint Started
    ///////////////////////////////////////////////////////////////////////////////////////////////////

    logInfo(">>> mem init usage: "+util.inspect(process.memoryUsage(), { showHidden: true, depth: null }));
    appLogInfo('Endpoint ['+endpointName+'] started');

    module.exports = webServicesServer;
})(require, process, module);
