var awsIot = require('aws-iot-device-sdk');


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





var thingShadows = awsIot.thingShadow({
   keyPath: './certs/'+ myThingName + '-private.pem.key',
  certPath: './certs/'+ myThingName +  '-certificate.pem.crt',
    caPath: './certs/rootCA.pem',
  clientId: myThingName,
    region: 'eu-west-1'
});

mythingstate = {
  "state": {
    "reported": {
      "ip": "unknown",
      "led" : 0
    }
  }
}

var networkInterfaces = require( 'os' ).networkInterfaces( );
mythingstate["state"]["reported"]["ip"] = networkInterfaces['wlan0'][0]['address'];



function update(){
  console.log("======>>>> Updating state:");

  mythingstate.state.reported.led  = Math.round(Math.random() * 100);
  console.log(prettyfy(mythingstate));
  var clientToken = thingShadows.update(myThingName, mythingstate);
  console.log("Updating state request is: " + clientToken);
  console.log("===========================");
}


thingShadows.on('connect', function() {
  console.log("Connected...");
  console.log("Registering...");
  thingShadows.register( myThingName );

  // An update right away causes a timeout error, so we wait about 2 seconds
  setTimeout( function() {
    console.log("Updating my IP address...");
    clientTokenIP = thingShadows.update(myThingName, mythingstate);
    console.log("Update:" + clientTokenIP);


    
    setInterval(update, 200);
  }, 2500 );








  // Code below just logs messages for info/debugging
  thingShadows.on('status',
    function(thingName, stat, clientToken, stateObject) {
       console.log('*** received '+stat+' on '+thingName+': '+
                   prettyfy(stateObject));
    });

  thingShadows.on('update',
      function(thingName, stateObject) {
         console.log('*** received update '+' on '+thingName+': '+
                     prettyfy(stateObject));
      });

  thingShadows.on('delta',
      function(thingName, stateObject) {
         console.log('*** received delta '+' on '+thingName+': '+
                     prettyfy(stateObject));
      });

  thingShadows.on('timeout',
      function(thingName, clientToken) {
         console.log('*** received timeout for '+ clientToken)
      });

  thingShadows
    .on('close', function() {
      console.log('*** close');
    });
  thingShadows
    .on('reconnect', function() {
      console.log('*** reconnect');
    });
  thingShadows
    .on('offline', function() {
      console.log('*** offline');
    });
  thingShadows
    .on('error', function(error) {
      console.log('*** error', error);
    });

});



function prettyfy(obj){
  return JSON.stringify(obj, null, 4);
}
