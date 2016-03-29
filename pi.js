"use strict";

var app = require('./app');
var sprintf = require('sprintf-js').sprintf;

// process.argv.forEach(function(val, index, array){
//    console.log(index + ':' + val);
//
// });

var args = process.argv.slice(2);


// -------- DEFAULT OPTIONS --------
var options = {
   //metric_loop_delay: 2000  // i remove this setting here, because now device intrinsically would have interval.

};


if ( args.length < 1 ){
   console.log('Please specify at least one command line argument');
   console.log(sprintf('Usage:     %s   <thing-name>   [<metric_loop_delay>] ', process.argv[0]));
   console.log(sprintf('<metric_loop_delay> in milliseconds. Default values is %d.', options.metric_loop_delay ));
   process.exit(1);
}



var myThingName = args[0];
if ( args.length >= 2 ){
  options.metric_loop_delay = args[1];
}

console.log("Starting virtual device with thing name: [" + myThingName + ']');

app.start(myThingName, options);
