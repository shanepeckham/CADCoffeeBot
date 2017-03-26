/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');
var util = require("util");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
var logicAppURL = process.env.ecommerceLogicApp;
var feedback;

bot.dialog('/', [
    function (session) {
    session.userData.preferredLanguage = session.message.text; 
    builder.Prompts.text(session, "Hello... What's your email address? ");
    
    },
    function (session, results) {
        session.userData.emailAddress = results.response;
        builder.Prompts.choice(session, "Which coffee can I get you?", ["Latte", "Americano", "Cappucino", "Espresso"]);
      
    },
    function (session, results) {
        session.userData.coffeeType = results.response.entity;
        session.send("Got it... " +  session.userData.emailAddress + 
                    ", you would like a " +  session.userData.coffeeType + ".");
        // Set the headers
            var headers = {
          'Content-Type': 'application/json'
            }
            
            // Configure the request
        var options = {
            url: logicAppURL, 
            method: 'POST',
            headers: headers,
            json: {"preferredLanguage":session.userData.preferredLanguage, 'emailAddress':session.userData.emailAddress, 'coffeeType':session.userData.coffeeType}
        }
        
       // Start the request
       try
       {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
           //     context.log('body', body)
              //     session.send(body);
             //      feedback = body;
                   feedback = JSON.stringify(body);
                   //var lng = JSON.parse(feedback);
                   session.send('Language is ' + feedback);
                   session.send(util.inspect(feedback, {showHidden: false, depth: null})); 
            }
            else
            {
              //  context.log('error occured ' + response.statusCode.toString());
                session.send(response.statusCode.toString());
            }
        })
       }
       catch(e)
       {
        session.send('error ' + e.message);
       }
       
    }
]);

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}