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
        
        if (eventData && eventData.type === 'Notification' && eventData.category === 'chatUpdate') {
            helper.getChatProbabilities(component, eventData.data);
        }
        
        if (eventData && eventData.category === 'change' && eventData.type === "Interaction" && eventData.data.new.isMessage == true) {
            helper.getConversation(component, eventData.data.new.id);
        }

        //Act on Interaction events when a new interaction is added that is not a chat
        if (eventData && eventData.type === 'Interaction' && eventData.category === 'add' && eventData.data.isChat != true && eventData.data.isMessage != true) {
            //Look for a participant attribute with the key "Call_Reason" and, if present, preload the knowledge suggestions
            helper.getCallReason(component, eventData.data.id);
            
            //Create a websocket for transcript notifications and pipe the data into the knowledge suggestion process
            helper.transcriptionNotifications(component, eventData.data.id);
        }
    }
})