var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var router = express.Router();

router.get('/:accid', function(clientReq, clientRes) {
    burst.getAccount(clientReq.params['accid'], function(response){
        clientRes.send(JSON.stringify(response));
    });
});

module.exports = router;
