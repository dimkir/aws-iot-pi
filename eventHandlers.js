"use strict";
var tools = require('./tools');
var sprintf = require('sprintf-js').sprintf;
var winston = require('winston');
var colors = require('colors');

module.exports = {

  registerHandlers : __REGISTER_HANDLERS

};

var publishFunction = null;
var displayStringFunction  = null;

function __REGISTER_HANDLERS(thingShadows, options){
    if ( undefined === options.publishFunction ) throw 'Must specify function as second argument';
    publishFunction = options.publishFunction;

    displayStringFunction = options.displayStringFunction;
    if ( undefined === displayStringFunction ) throw 'Please specify options.displayStringFunction when calling start()';


    winston.add(
      winston.transports.File, {
        filename: 'logs/delta.log',
        level: 'info',
        json : false,
        eol: '\n',
        timestamp: true
      }
    );
    winston.remove(winston.transports.Console);

    // Code below just logs messages for info/debugging
    thingShadows.on('status', on_status);
    thingShadows.on('update', on_update); // we received an update

    thingShadows.on('delta', on_delta); // delta is the key


    thingShadows.on('timeout', on_timeout );
    thingShadows.on('close', on_close);
    thingShadows.on('reconnect', on_reconnect);
    thingShadows.on('offline', on_offline);


    thingShadows.on('error', on_error);


}


function on_status(thingName, stat, clientToken, stateObject) {
  //  console.log(sprintf('*** received status [%s]  on [%s]. JSON: \n%s',
  //             stat,
  //             thingName,
  //             tools.prettyfy(stateObject)
  //           ));
}



/**
* Here it should receive the event and after that modify the
* state of the device.   Technically here should issue commands
* (And then respective parts of the device)
*/
function on_delta(thingName, stateObject){

  // this should skip all the changes to the "METRICS properties"
  // var msg = '*** received delta '+' on '+thingName+': \n'+
  //             tools.prettyfy(stateObject)
  var timestamp = new Date().getTime();
  var msg  = sprintf('*** [%d] received delta on [%s]', stateObject.timestamp, thingName);
  //console.log(colors.red(msg));
  displayStringFunction(msg);
  winston.info(msg);
  winston.info(tools.prettyfy(stateObject));


  // So let's see if we want to update anything at all.

   var delta = stateObject.state;
   for(var prop in delta){
     if ( !delta.hasOwnProperty(prop) ) {  winston.info(sprintf('Inside delta found not-own-property [%s]',prop));  continue; }
     var msg_update = sprintf('[%s] = [%s]',  prop, delta[prop] )
     //  console.log("From delta we got property to update " + colors.blue(msg_update));
     displayStringFunction(sprintf("Delta: %s",  msg_update));
     winston.info("From delta we got propety to update " + msg_update);
     // own property
     if ( 0 == prop.indexOf('_')){
       // this is actual interactive property

       PROPERTIES[prop] = delta[prop];
     }
     else{
       winston.info(sprintf('Requested desired state for a metric [%s] which is not an interactive property.',prop));
       PROPERTIES[prop] = delta[prop];
     }
     // should I update ALL of them together? Or one by one?
   }

  publishFunction(); // let's publish whatever we changed.


  return;


  //  here I should take into account what needs to be changed and

  if ( stateObject.clientToken ){
    if ( clientToken != LAST_CLIENT_TOKEN ){
       console.warn(sprintf(
          'Skipping delta with token [%s] because latest token we expect is [%s]',
           stateObject.clientToken,
           LAST_CLIENT_TOKEN
         ));
    }
  }



   var delta = stateObject.state;


   if ( delta.hasOwnProperty('a') ){
     PROPERTIES.a = delta.a;
   }


}

function on_update(thingName, stateObject){
  //  console.log('*** received update '+' on '+thingName+': '+
  //                      tools.prettyfy(stateObject));
}







function on_close(){
  console.log('*** offline');
}

function on_reconnect(){
  console.log('*** offline');
}

function on_offline(){
  console.log('*** offline');
}




function on_timeout(thingName, clientToken) {
   console.log('*** received timeout for '+ clientToken)
}


function on_error(error) {
   console.log('*** error', error);
 }
