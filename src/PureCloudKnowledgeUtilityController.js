({
    openArticle: function (component, event, helper) {
        var id = event.target.id;
        var articles = component.get('v.knowledgeArticles');
        var article = articles.filter(function (a) { return a.id == id; })[0];
        
        var workspaceAPI = component.find("workspace");
        workspaceAPI.openTab({
            url: article.url,
            focus: true
        }).then(function(response) {
            workspaceAPI.getTabInfo({
                tabId: response
            }).then(function(tabInfo) {
            console.error("The recordId for this tab is: " + tabInfo.recordId);
            });
        }).catch(function(error) {
            console.error(error);
        });
    },
    onClientEvent: function (component, message, helper) {
        var eventData = message.getParams();
        
        //subscribe to notification events on Lightning Message Channel
        if (eventData && eventData.type === 'InitialSetup') {
            component.find('clientEventMessageChannel').publish({
                "type": "PureCloud.subscribe",
 				"data": {
     				"type": "Notification",
     				"categories": ["chatUpdate", "messageUpdate", "conversationTranscription"]
  				}
            });
        }
        
        //handle conversationTranscription events, which are voice transcriptions
        if (eventData && eventData.category === 'conversationTranscription') {
            helper.handleConversationTranscription(component, eventData);
        }
        
        //handle messaging and web chat update events
        if (eventData && (eventData.category === 'messageUpdate' || eventData.category === 'chatUpdate')) {
            helper.handleMessageUpdate(component, eventData);
        }
    }
})