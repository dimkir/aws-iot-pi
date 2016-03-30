// loop.js
//
// ========
"use strict";
var sprintf = require('sprintf-js').sprintf;
var vsprintf = require('sprintf-js').vsprintf;
var perlin = require('perlin-noise');
var winston = require('winston');
var _ = require('lodash');

module.exports = {

  start : __START_LOOP,
  setMetricLoopDelay : _setMetricLoopDelay

};

var columns;
var noise;
var noise_index = 0;


const SECONDS = 1000;
const MINUTES = 60 * SECONDS;


var metric_loop_delay = 30 * SECONDS; // 30 seconds we start with

var restoringTimeout = null;

var restore_at_timestamp = null;

const _default_metric_loop_delay = 5 * MINUTES;

function _setMetricLoopDelay(delay, restore_after_millis){
    metric_loop_delay = delay;
    if ( latestTimeout )
        clearTimeout(latestTimeout);

    if ( restoringTimeout ) clearTimeout(restoringTimeout);
    restoringTimeout= setTimeout(function restoreDelayToDefault(){
        metric_loop_delay = _default_metric_loop_delay;
        if ( latestTimeout ) clearTimeout(latestTimeout);
        restore_at_timestamp = null;
        loop();

    }, restore_after_millis); // this will actually set timeout
    restore_at_timestamp = Date.now() + restore_after_millis;

    loop();

    //setTimeout(loop, metric_loop_delay);
}



var PROPERTY_OFFSETS = {
  a : 0,
  b: 400,
  c: 200
};

var publishFunction  = null;
var displayStringFunction = null;

var latestTimeout = null;

function __START_LOOP(options){
    setupWinston();

    publishFunction = options.publishFunction;
    if ( undefined === publishFunction ) throw 'Please specify options.publishFunction when calling start()';

    displayStringFunction = options.displayStringFunction;
    if ( undefined === displayStringFunction ) throw 'Please specify options.displayStringFunction when calling start()';

    if ( options.metric_loop_delay ){
      metric_loop_delay = options.metric_loop_delay;
    }

    noise = perlin.generatePerlinNoise(1000, 1, { amplitude: 0.5});
    //throw sprintf('Upon starting loop metric loop  delay is %s', metric_loop_delay); // neither displayStringFunction, neither console.log worked
    //setInterval(loop, metric_loop_delay);
    //latestTimeout = setTimeout(loop, metric_loop_delay);
    loop(); // this will run it for the first time and also would also setNext timer
}

function setupWinston(){

      // winston.add(
      //   winston.transports.File + "-metrics-loop", {
      //     filename: 'logs/metrics-loop.log',
      //     level: 'info',
      //     json : false,
      //     eol: '\n',
      //     timestamp: true
      //   }
      // );

    //  winston.remove(winston.transports.Console);
}

function loop(){

    //try{
        refreshMetrics();
        publishFunction(); // this will republish full project
        // var msg = sprintf("%4s %4d %4d", PROPERTIES.a, PROPERTIES.b, PROPERTIES.c);

        displayMetrics();
    //}
    //catch(e){
        //winston.error(e);
    //}
    latestTimeout = setTimeout(loop, metric_loop_delay);

}


function displayMetrics(){
  var filterTrueFalse = function(v){  return v ? 'true' : 'false' };

  // how to display all the properties... ?
  var propertiesToDisplay = {
    'sht_09':    {   filter: filterTrueFalse   },
    'pow_up_09': {},
    'pow_dw_09': {},
    'vsc_09'   : {},
    'vsc_08'   : {},
    '_mgn_up_09': {},
    '_mgn_dw_09': {}
  };

  var format_string = '';
  var elements = [];

  _.forOwn(propertiesToDisplay, function(opt, key){

     format_string +=  '\t' + key + ': %5s';

     elements.push( opt.filter ?  opt.filter(PROPERTIES[key]) : PROPERTIES[key]);
  });
  // displayStringFunction(format_string);
  var msg = vsprintf(format_string, elements);
  // var msg = sprintf("%8s %4d %4d %4d",
  //   PROPERTIES.sht_09 ? 'true' : 'false',
  //   PROPERTIES.pow_up_09,
  //   PROPERTIES.pow_dw_09,
  //   PROPERTIES.vsc_09
  //
  // );


  displayStringFunction(msg);
   // displayStringFunction(JSON.stringify(PROPERTIES));
   winston.info(msg);
}


function refreshMetrics(){



      _increaseMultipliers({ by: 1, upTo: 100});



    _.forOwn(PROPERTIES, function(value, key){
      if ( _.startsWith(key,'_') ) return; // we skip the Interactive properties

      PROPERTIES[key] = randInRange(PROPERTIES_MULTIPLIERS[key]);


      // BOOLEAN PROPERTIES
      if ( _.startsWith(key,'swc_up_')
        || _.startsWith(key, 'sht_')
      ) {
         PROPERTIES[key] = rand_boolean();
      }

    });


    PROPERTIES.a =  Math.round(100*noise[nextOffset('a')]);
    PROPERTIES.b =  Math.round(100*noise[nextOffset('b')]);
    PROPERTIES.c =  Math.round(100*noise[nextOffset('c')]);
    PROPERTIES.metric_loop_delay = metric_loop_delay;
    PROPERTIES.restore_at_timestamp = restore_at_timestamp;
    PROPERTIES.custom_delay_left_millis = restore_at_timestamp !== null ? restore_at_timestamp -  Date.now() : null;

}





// ---------------------------------------------------------------------------------------
// ---------------------------------- UTILITY FUNCTIONS ----------------------------------
// ---------------------------------------------------------------------------------------

function nextOffset(property){
   PROPERTY_OFFSETS[property]++;
   if ( PROPERTY_OFFSETS[property] >= noise.length ){
     PROPERTY_OFFSETS[property] = 0;
   }

   return PROPERTY_OFFSETS[property];
}



function randInRange(mult){
  return Math.round(Math.random() * mult);
}



function rand_boolean(){
  return Math.random() > 0.5;
}



// function _increaseMultipliers({ by: 1, upTo: 100}){
function _increaseMultipliers(options){
  // let's increase the multipliers to make charts look better.

  _.forOwn(PROPERTIES_MULTIPLIERS, function(val,key){

      if ( PROPERTIES_MULTIPLIERS[key] < options.upTo ){
          PROPERTIES_MULTIPLIERS[key] += options.by;
      }
  });
}
