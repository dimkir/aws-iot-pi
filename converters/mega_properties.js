"use strict";
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;
var _ = require('lodash');
var jsonfile = require('jsonfile');
var millis2human = require('../utils/millis2human');

module.exports = {

    convert : _convert

};

var debug_logging = false;


function _convert(payload){
    // here we convert things
    // we do not do anything for conversion.
    var fname_input  = sprintf('logs/converters/mega_properties/%s-%s.json', Date.now(), 'input');
    var fname_output = sprintf('logs/converters/mega_properties/%s-%s.json', Date.now(), 'output');

    debug_logging && jsonfile.writeFileSync(fname_input, payload, { spaces: 2} );

    var reported = payload.state.reported;

    var result = {};

    // ----------------------------------------
    // ----------- BOOLEANS -------------------
    // ----------------------------------------
    result.RED = sprintf('%s,%s,%s,%s,%s',
        reported.sht_08 ? '1' : '0',
        reported.sht_09 ? '1' : '0',
        reported.sht_18 ? '1' : '0',
        reported.sht_21 ? '1' : '0',
        reported.sht_26 ? '1' : '0'
    );

    result.BLUE = sprintf('%s,%s,%s,%s,%s',
        reported.swc_up_08 ? '1' : '0',
        reported.swc_up_09 ? '1' : '0',
        reported.swc_up_18 ? '1' : '0',
        reported.swc_up_21 ? '1' : '0',
        reported.swc_up_26 ? '1' : '0'
    );


    // TODO: this needs to get a source for it's data
    result.ORANGE = sprintf('%s,%s,%s,%s,%s',
        reported.orange_08 ? '1' : '0',
        reported.orange_09 ? '1' : '0',
        reported.orange_18 ? '1' : '0',
        reported.orange_21 ? '1' : '0',
        reported.orange_26 ? '1' : '0'
    );

    // ----------------------------------------
    // ----------- NUMERIC  -------------------
    // ----------------------------------------
    result.POW_DL = sprintf('%s,%s,%s,%s,%s',
        reported.pow_dw_08,
        reported.pow_dw_09,
        reported.pow_dw_18,
        reported.pow_dw_21,
        reported.pow_dw_26
    );

    result.POW_UL = sprintf('%s,%s,%s,%s,%s',
        reported.pow_up_08,
        reported.pow_up_09,
        reported.pow_up_18,
        reported.pow_up_21,
        reported.pow_up_26
    );


    result.NEAR_TOWER_UL = sprintf('%s,%s,%s,%s,%s',
        reported.neartower_up_08,
        reported.neartower_up_09,
        reported.neartower_up_18,
        reported.neartower_up_21,
        reported.neartower_up_26
    );

    result.NEAR_TOWER_DL = sprintf('%s,%s,%s,%s,%s',
        reported.neartower_dw_08,
        reported.neartower_dw_09,
        reported.neartower_dw_18,
        reported.neartower_dw_21,
        reported.neartower_dw_26
    );


    result.PHONE_NEAR = sprintf('%s,%s,%s,%s,%s',
        reported.vsc_08,
        reported.vsc_09,
        reported.vsc_18,
        reported.vsc_21,
        reported.vsc_26
    );

    result.OSC_DL = sprintf('%s,%s,%s,%s,%s',
        reported.osc_dw_08,
        reported.osc_dw_09,
        reported.osc_dw_18,
        reported.osc_dw_21,
        reported.osc_dw_26
    );

    result.OSC_UL = sprintf('%s,%s,%s,%s,%s',
        reported.osc_up_08,
        reported.osc_up_09,
        reported.osc_up_18,
        reported.osc_up_21,
        reported.osc_up_26
    );


    // ----------------------------------------
    // ----------- INTERACTIVE-----------------
    // ----------------------------------------

    result._GD800  = reported._mgn_dw_08;
    result._GD900  = reported._mgn_dw_09;
    result._GD1800 = reported._mgn_dw_18;
    result._GD2100 = reported._mgn_dw_21;
    result._GD2600 = reported._mgn_dw_26;


    result._GU800  = reported._mgn_up_08;
    result._GU900  = reported._mgn_up_09;
    result._GU1800 = reported._mgn_up_18;
    result._GU2100 = reported._mgn_up_21;
    result._GU2600 = reported._mgn_up_26;


    //result._CLK = 4; // TODO: remove this clock from there
    result['@VERSION'] = 'mega-v1';

     // ----------------------------------------
     // -----------  DEBUG     -----------------
     // ----------------------------------------
    result['@HELLO'] = 'hello';
    result['@METRIC_LOOP_DELAY'] = reported.metric_loop_delay;
    result['@RESTORE_AT_TIMESTAMP'] = reported.restore_at_timestamp;
    result['@CUSTOM_DELAY_LEFT_SECS'] = reported.custom_delay_left_millis;

    result.FAST_SAMPLING_SPEED          = millis2human.toHuman(reported.metric_loop_delay);
    result.FAST_SAMPLING_COUNTDOWN_SECS = millis2human.toSeconds(reported.custom_delay_left_millis);

    result._DEFAULT_SAMPLING_SPEED      = millis2human.toHuman(reported._default_sampling_speed);


    var shadow_message = {
        state: {
            reported: result
        }
    };

    debug_logging && jsonfile.writeFileSync(fname_output, shadow_message, { spaces: 2 });

    //return payload;
    return shadow_message;

}
