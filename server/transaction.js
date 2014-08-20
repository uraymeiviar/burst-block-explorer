var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var router = express.Router();

router.get('/:txid', function(clientReq, clientRes) {
    burst.getTransaction(clientReq.params['txid'], function(response){
        clientRes.send(JSON.stringify(response));
    });
});

module.exports = router;
