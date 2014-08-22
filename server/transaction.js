var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var async = require('async');
var router = express.Router();

function getTxRelatedAccount(tx, done){
    async.parallel(
        {
            sender: function(callback){
                burst.getAccount(tx.sender, function(acc){
                    if(acc.status === true){
                        tx.senderData = acc.message;
                    }
                    callback();
                });
            },
            recipient : function(callback){
                burst.getAccount(tx.recipient, function(acc){
                    if(acc.status === true){
                        tx.recipientData = acc.message;
                    }
                    callback();
                });
            }
        },
        function(err, results){
            done();
        }
    );
}

router.get('/:txid', function(clientReq, clientRes) {
    burst.getTransaction(clientReq.params['txid'], function(response){
        async.parallel(
            {
                account : function(callback){
                    getTxRelatedAccount(response.message, function(){
                        callback();
                    });
                },
                block : function(callback){
                    burst.getBlock(response.message.block, function(block){
                        if(block.status === true){
                            response.message.blockData = block.message;
                        }
                        callback();
                    })
                }
            },
            function(err, results){
                clientRes.send(JSON.stringify(response));
            }
        );

    });
});

module.exports = router;
