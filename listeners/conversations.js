// these are listeners needed to manage conversations

listeners.catchRtmEvents = {
    label: 'Catch RTM events',
    type: 'endpoint',
    options: {
        endpoint: endpoint.name,
        event: 'eventArrived'
    },
    callback: function(event) {
        app.endpoints[event.endpoint].convo.handleConvos(event);
    }
};

listeners.catchInteractiveMessages = {
    label: 'Catch interactive messages',
    type: 'endpoint',
    options: {
        endpoint: endpoint.name,
        event: 'interactiveMessage'
    },
    callback: function(event) {
        app.endpoints[event.endpoint].convo.handleConvos(event);
    }
};