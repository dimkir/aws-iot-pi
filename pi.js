var awsIot = require('aws-iot-device-sdk');
var tools = require('./tools');
// var publish = require('./publish');
var eventHandlers = require('./eventHandlers');
var loop  = require('./loop');
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;


// --------------- GLOBAL VARS -------------------
// these properties should NOT have representation in "desired" shadows.
PROPERTIES = {

   a: 10,
   b: 20,
   c: 30,

   // I will start with the _  properties, which MAY be
   // affected by the controller
   _led1 : "on",
   _led2 : "off"



};

LAST_CLIENT_TOKEN = null;


process.argv.forEach(function(val, index, array){
   console.log(index + ':' + val);

});

var args = process.argv.slice(2);

if ( args.length < 1 ){
   console.log('Please specify at least one command line argument');
   process.exit(1);
}



var myThingName = args[0];

console.log("Thing name is: [" + myThingName + ']');

// -----------------------------------------------------------
// ----------------- data      -------------------------------
// -----------------------------------------------------------

var thingShadows = awsIot.thingShadow({
   keyPath: './certs/'+ myThingName + '-private.pem.key',
  certPath: './certs/'+ myThingName +  '-certificate.pem.crt',
    caPath: './certs/rootCA.pem',
  clientId: myThingName,
    region: 'eu-west-1'
});


// This will be called upon each connection
thingShadows.on('connect', function() {
  console.log("Connected...");
  console.log("Registering...");
  thingShadows.register( myThingName );

  // An update right away causes a timeout error, so we wait about 2 seconds
  setTimeout( onRegistered, 1500 );

});

// onRegistered or reRegistered...
function onRegistered() {
  // THIS MAY BE CALLED TWICE ON RECONNECT - BECAUSE ON CONNECTION BROKEN
  // WE MAY GET CALLED AGAIN

  console.log("onRegistered() called...");

  // I probably want to send full updates
  publishState(thingShadows, myThingName);

  // this publish - it doesn't really fit the picture, it encapsulates "publishing global state" - basically
  // it simply published global state... but then parameters make no sense: why specify services and thing name,
  // if do not specify actual state...?

  initOtherThreads();


}


/**
* It inits other "threads" not really threads, but rather
* workers.
*/
var alreadyInitialized = false;
function initOtherThreads(){

      if ( alreadyInitialized ) return;
      var publishFunction = function(){
        publishState(thingShadows, myThingName);
      }

      eventHandlers.registerHandlers(thingShadows, publishFunction);

      loop.start({ publishFunction: publishFunction });
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
