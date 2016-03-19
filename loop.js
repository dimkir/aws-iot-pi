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

  start : __START_LOOP

};

var columns;
var noise;
var noise_index = 0;

var metric_loop_delay = 3000;

var PROPERTY_OFFSETS = {
  a : 0,
  b: 400,
  c: 200
};

var publishFunction  = null;
var displayStringFunction = null;


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
    setInterval(loop, metric_loop_delay);
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
    //return;


  refreshMetrics();
  publishFunction(); // this will republish full project
  // var msg = sprintf("%4s %4d %4d", PROPERTIES.a, PROPERTIES.b, PROPERTIES.c);

  displayMetrics();

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

    // let's increase the multipliers to make charts look better.
    _.forOwn(PROPERTIES_MULTIPLIERS, function(val,key){

        if ( PROPERTIES_MULTIPLIERS[key] < 100 ){
            PROPERTIES_MULTIPLIERS[key] += 1;
        }
    });


    _.forOwn(PROPERTIES, function(value, key){
      if ( _.startsWith(key,'_') ) return; // we skip the Interactive properties

      PROPERTIES[key] = rand(PROPERTIES_MULTIPLIERS[key]);


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

}


function nextOffset(property){
   PROPERTY_OFFSETS[property]++;
   if ( PROPERTY_OFFSETS[property] >= noise.length ){
     PROPERTY_OFFSETS[property] = 0;
   }

   return PROPERTY_OFFSETS[property];
}


function rand(mult){
  return Math.round(Math.random() * mult);
}

function rand_boolean(){
  return Math.random() > 0.5;
}
