"use strict";

var blessed = require('blessed');
var _ = require('lodash');


var box_global_options = {
  label: 'Default label',
  scrollable: true,
  draggable: false,
  width: '50%',
  height: '50%',
  tags: true,
  border: { type: 'line'},
  style: {
    fg: 'white',
    border: { fg: '#f0f0f0'}
    // ,hover: { bg: 'green'}
  }
};


module.exports = {
   boxWithEventsCreate : boxWithEventsCreate,
   boxConsoleCreate : boxConsoleCreate,
   boxWithMetricsStream: boxWithMetricsStream,
   boxStateCreate : boxStateCreate

};

function boxWithMetricsStream(){

  var def_opt = _.cloneDeep(box_global_options);
  var box = blessed.box(_.merge(def_opt, {
      label: 'Live metrics from device',
      left: '50%',
      top: '50%',

      // content: 'Hello {bold}world{/bold}',

      style :{ bg: 'green'  }
  }));
  return box;
}


function boxStateCreate(){

      var box = blessed.box(_.merge(_.cloneDeep(box_global_options),{
        label: 'Led states',
        top: '50%',
        style:{ bg: 'black' }
      }));
      return box;
}


function boxConsoleCreate(){
      var box = blessed.box(_.merge(_.cloneDeep(box_global_options),{
        label: 'Console messages',
        style:{ bg: 'black'}
      }));
      return box;
}


function boxWithEventsCreate(){

  var box = blessed.box(_.merge(_.cloneDeep(box_global_options),{
      label: 'Events messages (Deltas)',
      left: '50%',
      style :{ bg: 'blue' }
  }));
  return box;
}
