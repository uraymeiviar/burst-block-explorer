var express = require('express');
var burst = require('./burstapi');
var jsonFormat      = require('prettyjson');
var router = express.Router();

router.get('/:txid', function(clientReq, clientRes) {
    try{
        burst.getFullTransaction(clientReq.params['txid'], function(respond){
            clientRes.send(JSON.stringify(respond));
        }, false);
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
