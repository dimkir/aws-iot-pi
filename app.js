
var awsIot = require('aws-iot-device-sdk');
var tools = require('./tools');

// var publish = require('./publish');
var eventHandlers = require('./eventHandlers');
var loop  = require('./loop');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;
var YAML  = require('yamljs');
var _     = require('lodash');

var feedbackService = require('./feedbackService');


var disp = require('./utils/display');
var megaConverter = require('./converters/mega_properties.js');

module.exports = {
    start : __START
}



// --------------- GLOBAL VARS -------------------
// these properties should NOT have representation in "desired" shadows.
PROPERTIES = {
   a: 10,
   b: 20,
   c: 30,

   // I will start with the _  properties, which MAY be
   // affected by the controller
   _led1 : "on",
   _led2 : "off",
   _led3 : null
};

// In order to generate random numbers for the values, we use this multiplers.
PROPERTIES_MULTIPLIERS = {


};







LAST_CLIENT_TOKEN = null;

// --------------------------------------------------------
// ---------------- LOCAL STATIC VARS ---------------------
// --------------------------------------------------------

var alreadyInitialized = false;
// onRegistered or reRegistered...
var display = null;
var thingShadows = null;

var myThingName = null;
var startOptions = {};

function __START(thingName, options){

    myThingName = thingName;
    startOptions = options;


    display = disp.setupDisplay(thingName);


    preparePropertyNames().forEach(function(prop){
       PROPERTIES_MULTIPLIERS[prop] = 100;
       PROPERTIES[prop] = Math.round(Math.random() * PROPERTIES_MULTIPLIERS[prop]);
    });


    thingShadows = awsIot.thingShadow({
       keyPath: './certs/'+ myThingName + '-private.pem.key',
      certPath: './certs/'+ myThingName +  '-certificate.pem.crt',
        caPath: './certs/rootCA.pem',
      clientId: myThingName,
        region: 'eu-west-1'
    });

    // This will be called upon each connection
    thingShadows.on('connect', onConnect); // TODO: what happens if connect fails here?

    // read yaml
    var config  = YAML.load('config.yml');

    var feedbackServiceOptions = {};
    _.assign(feedbackServiceOptions, config.feedbackService);
    feedbackServiceOptions.shadowService = thingShadows;

    feedbackService.init(feedbackServiceOptions);

}

/**
* IMPORTANT: May be called several times (upon reconnect for example)
*/
var _myCommandTopic = null;

function onConnect(){
    display.log("Connected...");
    display.log("Registering...");


    // register for message topic
    var command_topic = sprintf('doradus/things/%s/command', myThingName);
    _myCommandTopic = command_topic;
    display.log(sprintf("Subscribing to command topic [%s]", command_topic));
    thingShadows.subscribe(command_topic);
    thingShadows.register( myThingName );

    // An update right away causes a timeout error, so we wait about 2 seconds
    setTimeout( onRegistered, 1500 );
}

function onRegistered() {
  // THIS MAY BE CALLED TWICE ON RECONNECT - BECAUSE ON CONNECTION BROKEN
  // WE MAY GET CALLED AGAIN

  display.log("onRegistered() called...");


  // I probably want to send full updates
  publishState(thingShadows, myThingName, megaConverter);

  // this publish - it doesn't really fit the picture, it encapsulates "publishing global state" - basically
  // it simply published global state... but then parameters make no sense: why specify services and thing name,
  // if do not specify actual state...?

  if ( !alreadyInitialized ){
    initOtherThreads();
    alreadyInitialized = true;
  }



}


/**
* It inits other "threads" not really threads, but rather
* workers.
*/

function initOtherThreads(){

    var publishFunction = function(){
        publishState(thingShadows, myThingName, megaConverter);
    }

    // TODO: if delay is short - the first reported state may be triggered before the handlers are set...
    loop.start({
        publishFunction: publishFunction,
        displayStringFunction : display.displayMetricsMessage,
        default_metric_loop_delay : startOptions.default_metric_loop_delay // can be undefined
    });

    eventHandlers.registerHandlers(thingShadows, {
        publishFunction : publishFunction,
        displayStringFunction:  display.displayEventsMessage,
        thingName : myThingName,
        myCommandTopic : _myCommandTopic,
        metricLoop : loop,
        feedbackService : feedbackService
    });


}


function publishState(thingShadows, myThingName, converter){
  // console.log("======>>>> Updating state:");


  // mythingstate.state.reported.led  = Math.round(Math.random() * 100);
  // delete mythingstate.version;
    // mythingstate.state.reported.led  = Math.round(Math.random() * 100);

  // var mythingstate_copy = clone mythingstate;
  var copy = JSON.parse(JSON.stringify(PROPERTIES));
  var payload = {
    state : {
      reported: copy
    }
  //  clientToken : LAST_CLIENT_TOKEN
  };

  display.displayState(copy); // we here update state

  // console.log("**************************************************");
  // console.log("************ THIS IS THE STATE WE WILL REPORT ****");
  // console.log("**************************************************");
  // console.log(tools.prettyfy(payload));
  // console.log("**************************************************");

  payload = (undefined !== converter) ? converter.convert(payload) : payload;
  var clientToken = thingShadows.update(myThingName, payload);
  winston.log(sprintf('Client token %s',clientToken))
  LAST_CLIENT_TOKEN = clientToken;

  // the weird thing is that this thingShadows.update( ) is actually
  // mutating the mythingstate???? weird right? should I simply generate new state always?

  // console.log("Updating state request is: " + clientToken);
  // console.log("===========================");
}



// ------------------------------------------------------------------
// ----------------- UTILITY FUNCTIONS   ----------------------------
// ------------------------------------------------------------------

function preparePropertyNames(){
  var freq = ['08','09','18','21','26'];

  var readingNames = [];

  freq.forEach(function(frq){

      readingNames.push(sprintf('pow_up_%s',frq));
      readingNames.push(sprintf('pow_dw_%s',frq));

      readingNames.push(sprintf('vsc_%s',frq));


      readingNames.push(sprintf('osc_up_%s',frq));
      readingNames.push(sprintf('osc_dw_%s',frq));

      readingNames.push(sprintf('neartower_dw_%s',frq));
      readingNames.push(sprintf('neartower_up_%s',frq));


      // Boolean values
      readingNames.push(sprintf('sht_%s',frq));

      readingNames.push(sprintf('swc_up_%s',frq));

      readingNames.push(sprintf('orange_%s',frq));


      // Interactive values
      readingNames.push(sprintf('_mgn_up_%s',frq));
      readingNames.push(sprintf('_mgn_dw_%s',frq));


  });

  return readingNames;
}
