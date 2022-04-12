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
                this.handleResponseError("Error searching knowledge: ", response);
                this.clear(component);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    getChatProbabilities : function (component, searchValue) {
    	var action = component.get("c.calculateChatIntent");
        if (searchValue.messages)
	        action.setParams({'chat' : searchValue.messages[searchValue.messages.length - 1].body});
        else
            action.setParams({'chat' : searchValue});
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
                this.handleResponseError("Error getting chat probabilities: ", response);
            }
        });
        $A.enqueueAction(action);
    },
    
    clear : function(component) {
        component.set('v.knowledgeArticles', []);
        component.set('v.numResults', 0);
    },

    //Passes the current conversationId to the Apex component's getAttributes method to retrive the Call_Reason attribute,
    //which is then used to invoke the getChatProbabilities helper method
    getCallReason : function (component, conversationId) {
        var action = component.get("c.getAttributes");
        action.setParams({'conversationId' : conversationId});
        action.setCallback(this, function(response) {
            var state = response.getState();
            if(state === "SUCCESS") {
	            console.log('intent: ', response.getReturnValue());
                var updateAction = component.get("c.updateLastUtterance");
                updateAction.setParams({'recordId': component.get("v.recordId"), 'utterance': response.getReturnValue()});
                updateAction.setCallback(this, function(response) {
                	var appEvt = $A.get("e.lightning:nextBestActionsRefresh");
                    appEvt.setParam("recordId", component.get("v.recordId"));
                    appEvt.fire();
                });
                $A.enqueueAction(updateAction);

                this.getChatProbabilities(component, response.getReturnValue());
            }
            else {
				this.handleResponseError("Error getting intent: ", response);
            }
        });
        $A.enqueueAction(action);
    },

    //Get the conversation details
    getConversation : function (component, conversationId, messageId) {
        var action = component.get("c.getConversation");
        action.setParams({'conversationId': conversationId});
        action.setCallback(this, function(response) {
            var state = response.getState();
            if(state === "SUCCESS") {
                this.getMessage(component, response.getReturnValue());
            }
            else {
                this.handleResponseError("Error getting conversation details: ", response);
            }
        });
        $A.enqueueAction(action);
    },

    //Get the text body from the most recent customer message
    getMessage: function (component, conversationDetails) {
        var action = component.get("c.getMessage");
        var conversation = JSON.parse(conversationDetails);
        var messageCount = conversation.participants[0].messages[0].messages.length;
        if (messageCount <= 0)
            return;
        var Uri = conversation.participants[0].messages[0].messages[messageCount-1].messageURI;
        console.log('messageURI: ', Uri);
        action.setParams({'Uri': Uri});
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var message = JSON.parse(response.getReturnValue());
                var updateAction = component.get("c.updateLastUtterance");
                updateAction.setParams({'recordId': component.get("v.recordId"), 'utterance': message.textBody});
                updateAction.setCallback(this, function(response) {
                	var appEvt = $A.get("e.lightning:nextBestActionsRefresh");
                    appEvt.setParam("recordId", component.get("v.recordId"));
                    appEvt.fire();
                });
                $A.enqueueAction(updateAction);
                this.getChatProbabilities(component, message.textBody);
            }
            else
                this.handleResponseError("Error getting message body: ", response);
        });
        $A.enqueueAction(action);
    },

    //Subscribes to the call transcript notification topic for the current call and handles new transcripts by responding with
    //the same code as the getChatProbabilities and searchKnowledge helper methods. I could not find a way to call those
    //directly...this would be a useful refactor of this method
    transcriptionNotifications : function (component, conversationId) {
    	var action = component.get("c.getWssUri");
		action.setCallback(this, function(response) {
            var body = JSON.parse(response.getReturnValue());
            var nextAction = component.get("c.subscribeToTopic");
            nextAction.setParams({'channelId': body.id, 'topic': 'v2.conversations.' + conversationId + '.transcription'});
            nextAction.setCallback(this, function(response) {
                console.log('successfullySubscribed');
            });
            $A.enqueueAction(nextAction);
            var websocket = new WebSocket(body.connectUri);
            websocket.onmessage = $A.getCallback(function(message){
                var messageData = JSON.parse(message.data);
                if (messageData.topicName != 'channel.metadata' && messageData.eventBody.transcripts) {
                    for (var x=0; x<messageData.eventBody.transcripts.length; x++) {
                        if (messageData.eventBody.transcripts[x].channel == "EXTERNAL") {
                            var updateAction = component.get("c.updateLastUtterance");
                            updateAction.setParams({'recordId': component.get("v.recordId"), 'utterance': messageData.eventBody.transcripts[x].alternatives[0].transcript});
                            updateAction.setCallback(this, function(response) {
                                var appEvt = $A.get("e.lightning:nextBestActionsRefresh");
                                appEvt.setParam("recordId", component.get("v.recordId"));
                                appEvt.fire();
                            });
                            $A.enqueueAction(updateAction);
                            
                            var lastAction = component.get("c.calculateChatIntent");
                            var searchValue = messageData.eventBody.transcripts[x].alternatives[0].transcript;
                            lastAction.setParams({'chat' : searchValue});
                            lastAction.setCallback(this, function(response) {
                                var state = response.getState();
                                if(state === "SUCCESS") {
                                    var fullResponse = response.getReturnValue();
                                    var labels = [];
                                    fullResponse.forEach(function(res) {
                                        labels.push(res.label); 
                                    });
                                    
                                    if(labels) {
                                        labels = JSON.stringify(labels);
                                        var anotherAction = component.get("c.searchKnowledge");
                                        anotherAction.setParams({'searchValue': labels});
                                        
                                        anotherAction.setCallback(this, function(response) {
                                            var state = response.getState();            
                                            if(state === "SUCCESS") {
                                                var articles = JSON.parse(response.getReturnValue());                
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
                                                component.set('v.knowledgeArticles', []);
                                                component.set('v.numResults', 0);
                                            }
                                        });
                                        
                                        $A.enqueueAction(anotherAction);
                                    } else {
                                        component.set('v.knowledgeArticles', []);
        								component.set('v.numResults', 0);
                                    }
                                } else {}
                            });
                            $A.enqueueAction(lastAction);
                        }
                    }
                }
            });
        });
        $A.enqueueAction(action);
	},

    handleResponseError: function(errorMsg, response) {
        var errors = response.getError();
        errors.forEach(function(error) {
            console.error(errorMsg, error.message);
        });
    }
})