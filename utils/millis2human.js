"use strict";
var winston = require('winston');
var sprintf = require('sprintf-js').sprintf;
var _ = require('lodash');
var jsonfile = require('jsonfile');


module.exports =  {

    toHuman         : _toHuman,
    toSeconds       : _toSeconds

};


function _toSeconds(millis){
    return Math.floor(millis/1000);
}

function _toHuman(millis){
    if ( undefined === millis) {
        return null;
    }

    if ( null === millis ){
        return null;
    }


    if ( isRoundSeconds(millis) ){
        var secs = Math.floor(millis / 1000);

        if ( isRoundMinutes(secs)){

            var mins = Math.floor(secs/60);
            return sprintf('%sm',mins);


        }

        return sprintf('%ss', secs);


    }
    return sprintf('%sms', millis);


}


function isRoundSeconds(millis){
    return millis % 1000 == 0;
}

function isRoundMinutes(seconds){
    return seconds % 60  == 0;
}

