var awsIot = require('aws-iot-device-sdk');
var tools = require('./tools');
// var publish = require('./publish');
var eventHandlers = require('./eventHandlers');
var loop  = require('./loop');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;

var blessed = require('blessed');

var screenUtils = require('./screenUtils');


module.exports = {
    start : __START
}

var displayStringFunction = function(s){
   boxConsole.addLine(0, s);
   screen.render();
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

    thingShadows = awsIot.thingShadow({
       keyPath: './certs/'+ myThingName + '-private.pem.key',
      certPath: './certs/'+ myThingName +  '-certificate.pem.crt',
        caPath: './certs/rootCA.pem',
      clientId: myThingName,
        region: 'eu-west-1'
    });




    display = setupDisplay();

    // This will be called upon each connection
    thingShadows.on('connect', onConnect);

}

/**
* IMPORTANT: May be called several times (upon reconnect for example)
*/
function onConnect(){
    display.log("Connected...");
    display.log("Registering...");
    thingShadows.register( myThingName );

    // An update right away causes a timeout error, so we wait about 2 seconds
    setTimeout( onRegistered, 1500 );
}

function onRegistered() {
  // THIS MAY BE CALLED TWICE ON RECONNECT - BECAUSE ON CONNECTION BROKEN
  // WE MAY GET CALLED AGAIN

  display.log("onRegistered() called...");

  // I probably want to send full updates
  publishState(thingShadows, myThingName);

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
        publishState(thingShadows, myThingName);
      }

      eventHandlers.registerHandlers(thingShadows, {
        publishFunction : publishFunction,
        displayStringFunction:  display.displayEventsMessage
      });

      loop.start({
        publishFunction: publishFunction,
        displayStringFunction : display.displayMetricsMessage,
        metric_loop_delay : startOptions.metric_loop_delay // can be undefined
       });
}


function publishState(thingShadows, myThingName){
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


  var clientToken = thingShadows.update(myThingName, payload);
  winston.log(sprintf('Client token %s',clientToken))
  LAST_CLIENT_TOKEN = clientToken;

  // the weird thing is that this thingShadows.update( ) is actually
  // mutating the mythingstate???? weird right? should I simply generate new state always?

  // console.log("Updating state request is: " + clientToken);
  // console.log("===========================");
}



function setupDisplay(){

  var screen = blessed.screen({
    smartCSR : true
  });

  screen.title = sprintf("Virtual RPi device [%s]", myThingName);
  screen.key(['escape','q','C-c'], function(ch, key){
      return process.exit(0);
  });

  var boxWithMetrics = screenUtils.boxWithMetricsStream();
  screen.append(boxWithMetrics);

  var boxWithEvents = screenUtils.boxWithEventsCreate();
  screen.append(boxWithEvents);

  var boxConsole = screenUtils.boxConsoleCreate();
  screen.append(boxConsole);

  var boxState  = screenUtils.boxStateCreate();
  screen.append(boxState);

  //box.focus();
  screen.render();

  var log = function(s){
    // console.log(boxConsole);
    // winston.log(boxConsole);
    // process.exit(2);
    boxConsole.insertLine(0, s);
    screen.render();
  };
  return {
      displayMetricsMessage : function(s){
        boxWithMetrics.insertLine(0, s);
        screen.render();
      },
      displayConsoleMessage: log,
      log: log,
      displayEventsMessage: function(s){
        boxWithEvents.insertLine(0,s);
        screen.render();
      },
      displayState : function(state){

        var wrapColor = function(str_on_off){
          if ( "off" == str_on_off){
            return sprintf("{red-bg}%4s{/red-bg}", str_on_off);
          }
          else if ( "on" == str_on_off ){
            return sprintf("{green-bg}%4s{/green-bg}",str_on_off);
          }
          else{
            return str_on_off;
          }
        }

        boxState.setContent(sprintf("LED-1 [%s]  \t   LED-2 [%s]     \t    LED-3  [%s]",
          wrapColor(state._led1),
          wrapColor(state._led2),
          wrapColor(state._led3)
        ));
        screen.render();
      }

  };
}
