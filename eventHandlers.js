"use strict";
var tools = require('./tools');
var sprintf = require('sprintf-js').sprintf;
var winston = require('winston');
var colors = require('colors');
var jsonfile = require('jsonfile');
var _ = require('lodash');
var Type = require('type-of-is');



module.exports = {

  registerHandlers : __REGISTER_HANDLERS

};

var publishFunction = null;
var displayStringFunction  = null;
function log(s){
    displayStringFunction(s);
}

var thingName = null;
var _options = {

  myCommandTopic : null   // this is topic we can subscrige

};

/**
*
* var options
*     options.myCommandTopic            <string>    Topic via which we receive commands.
*     options.publishFunction           <function>  initiates publishing of the state
*     options.displayStringFunction     <function>  allows event handler to display text info to console
*/


function __REGISTER_HANDLERS(thingShadows, options){
    if ( undefined === options.publishFunction ) throw 'Must specify function as second argument';
    publishFunction = options.publishFunction;

    displayStringFunction = options.displayStringFunction;
    if ( undefined === displayStringFunction ) throw 'Please specify options.displayStringFunction when calling start()';

    thingName = options.thingName;

    _options = options;

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
    //thingShadows.on('status', on_status);
    thingShadows.on('update', on_update); // we received an update // ??? what does it mean 'update'?
    thingShadows.on('message', on_message);

    thingShadows.on('delta', on_delta); // delta is the key


    thingShadows.on('timeout', on_timeout );
    thingShadows.on('close', on_close);
    thingShadows.on('reconnect', on_reconnect);
    thingShadows.on('offline', on_offline);


    thingShadows.on('error', on_error);


}



function on_message(topic, payloadBuffer){
    //log(sprintf("--- on_message: [%s] payload [%s]", topic, JSON.stringify(payload)));  // this probably is - in case it is json - then it is object
    log(sprintf("--- on_message: [%s] payload [%s]", topic, payloadBuffer.toString()));

    // we only care if this is actual command sent to us
    if ( _options.myCommandTopic == topic ) {
          winston.info("Payload is of type " + Type(payloadBuffer) + ' and is: ' );
          winston.info(payloadBuffer);
          var payloadString = payloadBuffer.toString();

          var payload;
          if ( payloadString[0] == '{'){
            // this can be actually jso
            try{
              payload = JSON.parse(payloadString); // TODO: this would crash maybe add error checking
            }
            catch(e){
              var msg = sprintf('We received command message with payload, which started with "{" but could not be parsed as json [%s]', payloadString);
              winston.error(msg);
              log(msg);
              return; // RETURN RETURN RETURN RETURN
            }
          }
          else{
            payload = payloadString;
          }

          var cmd = _.has(payload,'command') ?  payload.command : payload;
          on_command(thingName, cmd, payload);
    }

}


function on_command(thingName, command, payload){

    log(sprintf("*** Received command [%s]", command));

    var allowed_commands = {
       recalibrate :  __recalibrate,
       reboot      :  __reboot,
       shutdown    :  __shutdown,
       logme       :  __logme
    };

    if ( ! _.has(allowed_commands, command) ){
      var propertiesToString = function(obj){ var s = '';  _.forOwn(obj, function(v,k){  s += ',' + k; }); return s; };
      var known_commands_str = propertiesToString(allowed_commands);
      log(sprintf("### Unknown command '%s', only commands [%s] are known." , command, known_commands_str));
      return;
    }

    allowed_commands[command](thingName, payload);

}

// -------------------------------------------------------
// ------------------ COMMANDS ---------------------------
// -------------------------------------------------------

function __recalibrate(){
    _.forOwn(PROPERTIES_MULTIPLIERS, function(val,key){
        PROPERTIES_MULTIPLIERS[key] = 20;

    });

}


function __reboot(){
    process.exit(3);
}


function __shutdown(){
    process.exit(77);
}


function __logme(thingName, args){
  // here I want to log commands.
  var ts = Date.now();
  var fname =  sprintf('logs/commands/logme/%s-%s.json',  thingName, ts );
  jsonfile.writeFileSync( fname, args, { spaces: 2});
}


// --------------------------------------------------------

function on_status(thingName, stat, clientToken, stateObject) {
    log(sprintf('*** received status [%s]  on [%s]. JSON: \n%s',
               stat,
               thingName,
               tools.prettyfy(stateObject)
             ));
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


  ////  here I should take into account what needs to be changed and
  //
  //if ( stateObject.clientToken ){
  //  if ( clientToken != LAST_CLIENT_TOKEN ){
  //     console.warn(sprintf(
  //        'Skipping delta with token [%s] because latest token we expect is [%s]',
  //         stateObject.clientToken,
  //         LAST_CLIENT_TOKEN
  //       ));
  //  }
  //}
  //
  //
  //
  // var delta = stateObject.state;
  //
  //
  // if ( delta.hasOwnProperty('a') ){
  //   PROPERTIES.a = delta.a;
  // }


}

function on_update(thingName, stateObject){
    log('*** received update '+' on '+thingName+': '+
                        tools.prettyfy(stateObject));
}







function on_close(){
  log('*** close');

}

function on_reconnect(){
  log('*** reconnect');
}

function on_offline(){
  log('*** offline');
}




function on_timeout(thingName, clientToken) {
   log('*** received timeout for '+ clientToken)
}


function on_error(error) {
   log(sprintf('*** error %s', error));
 }
