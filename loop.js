// loop.js
//
// ========
"use strict";
var sprintf = require('sprintf-js').sprintf;
var perlin = require('perlin-noise');
var winston = require('winston');

module.exports = {

  start : __START_LOOP

};

var columns;
var noise;
var noise_index = 0;

var PROPERTY_OFFSETS = {
  a : 0,
  b: 400,
  c: 200
};

var publishFunction  = null;


function __START_LOOP(options){
    setupWinston();
    publishFunction = options.publishFunction;
    if ( undefined === publishFunction ) throw 'Please specify options.publishFunction when calling start()';
    noise = perlin.generatePerlinNoise(1000, 1, { amplitude: 0.5});
    setInterval(loop, 3000);
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
  // PROPERTIES.a =  rand();
  // PROPERTIES.b =  rand();


  refreshMetrics();
  publishFunction(); // this will republish full project
  winston.info(sprintf("%4s %4d %4d", PROPERTIES.a, PROPERTIES.b, PROPERTIES.c));

}


function refreshMetrics(){

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


function rand(){

  return Math.round(Math.random() * 1000);
}
