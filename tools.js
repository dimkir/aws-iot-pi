// tools.js
// ========
"use strict";
module.exports = {
  foo: function () {
    // whatever
    console.log('foo');
  },
  bar: function () {
    // whatever
    console.log('bar');
  },


  prefix: PREFIX,

  prettyfy: prettyfy
};


var PREFIX = '--';

var zemba = function () {

  console.log('zemba');
}




function prettyfy(obj){
  return JSON.stringify(obj, null, 4);
}
