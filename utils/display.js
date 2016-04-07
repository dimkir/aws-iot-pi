"use strict";

var blessed = require('blessed');

var screenUtils = require('./screenUtils');
var sprintf = require('sprintf-js').sprintf;

module.exports = {

    setupDisplay: setupDisplay

};


function setupDisplay(myThingName){

    var screen = blessed.screen({
        smartCSR : true
    });

    screen.title = sprintf("Virtual RPi device [%s]", myThingName);
    screen.key(['escape','q','C-c'], function(ch, key){
        return process.exit(0);
    });

    var boxWithMetrics = screenUtils.boxWithMetricsStream();
    screen.append(boxWithMetrics);

    var boxWithEvents = screenUtils.boxWithEventsCreate();
    screen.append(boxWithEvents);

    var boxConsole = screenUtils.boxConsoleCreate();
    screen.append(boxConsole);

    var boxState  = screenUtils.boxStateCreate();
    screen.append(boxState);

    //box.focus();
    screen.render();

    var log = function(s){
        // console.log(boxConsole);
        // winston.log(boxConsole);
        // process.exit(2);
        boxConsole.insertLine(0, s);
        screen.render();
    };
    return {
        displayMetricsMessage : function(s){
            var l = boxWithMetrics.getLines().length;
            if ( l > 20 ){
              boxWithMetrics.deleteTop();
            }
            //boxWithMetrics.insertLine(0, s);
            boxWithMetrics.pushLine(s);
            screen.render();
        },
        displayConsoleMessage: log,
        log: log,
        displayEventsMessage: function(s){
            boxWithEvents.insertLine(0,s);
            screen.render();
        },
        displayState : function(state){

            var wrapColor = function(str_on_off){
                if ( "off" == str_on_off){
                    return sprintf("{red-bg}%4s{/red-bg}", str_on_off);
                }
                else if ( "on" == str_on_off ){
                    return sprintf("{green-bg}%4s{/green-bg}",str_on_off);
                }
                else{
                    return str_on_off;
                }
            }

            boxState.setContent(sprintf(
                "LED-1 [%s]  \t   LED-2 [%s]     \t    LED-3  [%s]\n" +
                "MGain 900Mhz Up [%s] \t MGain 900Mhz Down [%s]\n" +
                "\n" +
                "Metric Loop Delay [%s]\n" +
                "Restore At Timestamp [%s]\n" +
                "Custom Delay Left Millis [%s]\n",
                wrapColor(state._led1),
                wrapColor(state._led2),
                wrapColor(state._led3),
                sprintf("{blue-bg}%5s{/blue-bg}",state._mgn_up_09),
                sprintf("{blue-bg}%5s{/blue-bg}",state._mgn_dw_09),
                sprintf("{yellow-bg}%s{/yellow-bg}",state.metric_loop_delay),
                sprintf("{yellow-bg}%s{/yellow-bg}",state.restore_at_timestamp),
                sprintf("{yellow-bg}%s{/yellow-bg}",state.custom_delay_left_millis)
            ));

            //state.metric_loop_delay
            //state.restore_at_timestamp
            //state.custom_delay_left_millis
            screen.render();
        }

    };
}
