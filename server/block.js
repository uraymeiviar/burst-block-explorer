var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var router = express.Router();

router.get('/:blkid', function(clientReq, clientRes) {
    burst.getBlock(clientReq.params['blkid'], function(response){
        clientRes.send(JSON.stringify(response));
    });
});

module.exports = router;
