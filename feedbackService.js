"use strict";

var _         = require('lodash');
var sprintf   = require('sprintf-js').sprintf;
var vsprintf  = require('sprintf-js').vsprintf;
var should    = require('should');

/**
Whether this module should be exposing interface
  - publishSuccess(thing, args)
  - publishSuccess(args) (whereas feedbackService is initialized for  given thingName)


*/
module.exports = {
    init: init,
    publishSuccess: publishSuccess,
    publishFailure: publishFailure


};


var _OPTIONS = null;

function init(options){
   options = options || {};
   var default_options = {

   };

   options.should.have.property('successTopic');         // <string>    in sprintf format (eg. doradus/things/%s/feedback/success)
   options.should.have.property('failureTopic');        // <function>  e.g. doradus/things/%s/feedback/failure
   options.should.have.property('shadowService');  // <function>  allows event handler to display text info to console

   _.assign(options, default_options)
   _OPTIONS = options;
}

/**
* Publishes specified object to topic
*/
function publishSuccess(thingName, args){
  var successTopic = sprintf(_OPTIONS.successTopic, thingName);
  _publishToTopic(successTopic, args);

}


function publishFailure(thingName, args){
  var failureTopic = sprintf(_OPTIONS.failureTopic, thingName);
  _publishToTopic(failureTopic, args);
}


function _publishToTopic(topicName, args){
  var payload;
  if ( 'string' == typeof args ){
    payload =  args;
  }
  else{
    payload = JSON.stringify(args);
  }

  // console.log(sprintf("publishing to topic [%s]", topicName));
  _OPTIONS.shadowService.publish(topicName, payload);
}
