var express = require('express');
var burst = require('./burstapi');
var jsonFormat      = require('prettyjson');
var router = express.Router();


router.get('/:accid', function(clientReq, clientRes) {
    try{
        burst.getFullAccount(clientReq.params['accid'], function(response){
            clientRes.send(JSON.stringify(response));
        }, false);
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
