({
    searchKnowledge : function(component, searchValue, fullResponse) {
        var action = component.get("c.searchKnowledge");
        action.setParams({'searchValue': searchValue});
        
        action.setCallback(this, function(response) {
            var state = response.getState();            
            if(state === "SUCCESS") {
                var response = response.getReturnValue();
                var articles = JSON.parse(response);                
                articles.data.forEach(function(article) {
                    fullResponse.forEach(function(responseItem) {	
                        if(article.title === responseItem.label)
                            article.probability = responseItem.probability;
                    });
                });
                articles.data.sort(function(msg1, msg2) { return msg2.probability - msg1.probability });
                component.set('v.knowledgeArticles', articles.data);
                component.set('v.numResults', articles.data.length);
            } else {
                console.error('### Error searching knowledge');
                this.clear(component);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    getChatProbabilities : function (component, searchValue) {
    	var action = component.get("c.calculateChatIntent");
        action.setParams({'chat' : searchValue.messages[searchValue.messages.length - 1].body}); 
        
        action.setCallback(this, function(response) {
            var state = response.getState();
            
            if(state === "SUCCESS") {
                var response = response.getReturnValue();
                var labels = [];
                response.forEach(function(res) {
                	labels.push(res.label); 
                });
                
                if(labels) {
                    labels = JSON.stringify(labels);
                    this.searchKnowledge(component, labels, response);
                } else {
                    this.clear(component);
                }
            } else {
                var errors = response.getError();
                errors.forEach(function(error) {
                    console.error("### response error:", error.message);
                });
            }
        });
        $A.enqueueAction(action);
    },
    
    clear : function(component) {
        component.set('v.knowledgeArticles', []);
        component.set('v.numResults', 0);
    }
})