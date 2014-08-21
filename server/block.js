var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var async = require('async');
var router = express.Router();

router.get('/:blkid', function(clientReq, clientRes) {
    burst.getBlock(clientReq.params['blkid'], function(response){
        var block = response.message;
        async.parallel(
            {
                prev: function(callback){
                    if (block.hasOwnProperty('previousBlock')) {
                        burst.getBlock(block.previousBlock, function (prevBlock) {
                            if (prevBlock.status === true) {
                                callback(null, prevBlock.message);
                            }
                            else {
                                callback(null, null);
                            }
                        });
                    }
                    else {
                        callback(null, null);
                    }
                },
                next : function (callback) {
                    if (block.hasOwnProperty('nextBlock')) {
                        burst.getBlock(block.nextBlock, function (nextBlock) {
                            if (nextBlock.status === true) {
                                callback(null, nextBlock.message);
                            }
                            else {
                                callback(null, null);
                            }
                        });
                    }
                    else {
                        callback(null, null);
                    }
                }
            },
            function(err, results){
                response.message.previousBlockData = results.prev;
                response.message.nextBlockData = results.next;
                clientRes.send(JSON.stringify(response));
            }
        );
    });
});

module.exports = router;
