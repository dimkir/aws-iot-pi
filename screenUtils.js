
var blessed = require('blessed');

module.exports = {
   boxWithEventsCreate : boxWithEventsCreate,
   boxConsoleCreate : boxConsoleCreate,
   boxWithMetricsStream: boxWithMetricsStream,
   boxStateCreate : boxStateCreate

};

function boxWithMetricsStream(){
  var box = blessed.box({
      label: 'Live metrics from device',
      left: '50%',
      top: '50%',
      scrollable: true,
      draggable: true,
      width: '50%',
      height: '50%',
      // content: 'Hello {bold}world{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      style :{
        fg: 'white',
        bg: 'magenta',
        border: {
          fg: '#f0f0f0'
        },
        hover: {
          bg: 'green'
        }
      }

  });
  return box;
}


function boxStateCreate(){
      var box = blessed.box({
        width: '50%',
        height: '50%',
        top: '50%',
        draggable: true,
        scrollable: true,
        tags: true, // color tags probably
        border: {
          type: 'line'
        },
        style:{
          fg: 'white',
          bg: 'black',
          border: {
            fg: '#f0f0f0'
          }
        }
      });
      return box;
}


function boxConsoleCreate(){
      var box = blessed.box({
        width: '50%',
        height: '50%',
        draggable: true,
        scrollable: true,
        tags: true, //? ??
        border: {
          type: 'line'
        },
        style:{
          fg: 'white',
          bg: 'black',
          border: {
            fg: '#f0f0f0'
          }
        }
      });
      return box;
}


function boxWithEventsCreate(){

  var box = blessed.box({
      label: 'Events box',
      left: '50%',
      // top: '0%',
      // top: '50%',
      scrollable: true,
      draggable: true,
      width: '50%',
      height: '50%',
      // content: 'Hello {bold}world{/bold}',
      tags: true,
      border: {
        type: 'line'
      },
      style :{
        fg: 'white',
        bg: 'blue',
        border: {
          fg: '#f0f0f0'
        },
        hover: {
          bg: 'green'
        }
      }

  });
  return box;
}
