var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var async = require('async');
var jsonFormat      = require('prettyjson');
var router = express.Router();

router.get('/:blkid', function(clientReq, clientRes) {
    try{
        burst.getFullBlock(clientReq.params['blkid'], function(respond){
           clientRes.send(JSON.stringify(respond));
        }, false);
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
