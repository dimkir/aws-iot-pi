var app = require('./app');

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

app.start(myThingName);
