({
    initComponent : function(component, event, helper) {
        var clientOrigin;
        var action = component.get("c.getCallCenterUrl");
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            if(state === "SUCCESS") {
                var returnedUrl = response.getReturnValue();
                clientOrigin = returnedUrl.match(/^(http(s?):\/\/[^\/]+)/gi)[0];
                
                window.addEventListener("message", $A.getCallback(function(event) {

                    //Check for origin and reject message if no match
                    if(event.origin !== clientOrigin) {
                        return;
                    }
        
                    if (event.data && event.data.type === 'Notification' && event.data.category === 'chatUpdate') {
                        helper.getChatProbabilities(component, event.data.data);
                    }
                }), false);
            } else {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.error("Error message: " + errors[0].message);
                    }
                } else {
                    console.error("Unknown error");
                }
            }
        });

        $A.enqueueAction(action);
    },
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
    }
})