var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var async = require('async');
var jsonFormat      = require('prettyjson');
var router = express.Router();

function getRelatedBlock(block, done){
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
            block.previousBlockData = results.prev;
            block.nextBlockData = results.next;
            done();
        }
    );
}

function getRelatedTransaction(block, target, done){
    if( block.hasOwnProperty('transactions') &&
        block.transactions.length > 0){
        async.each(block.transactions,
            function(txid, callback){
                burst.getTransaction(txid, function(txData){
                    if(txData.status === true){
                        target.push(txData.message);
                    }
                    callback();
                });
            },
            function(err){
                done();
            }
        );
    }
    else{
        done();
    }
}

function getRelatedAccount(block, done){
    var accList = [block.generator];
    if(block.hasOwnProperty('transactionsData')){
        for(var txid in block.transactionsData){
            if(block.transactionsData.hasOwnProperty(txid)){
                if(accList.indexOf(block.transactionsData[txid].sender) == -1) {
                    accList.push(block.transactionsData[txid].sender);
                }
                if(accList.indexOf(block.transactionsData[txid].recipient) == -1) {
                    accList.push(block.transactionsData[txid].recipient);
                }
            }
        }
    }
    block.relatedAccounts = [];
    async.each(accList,
        function(accId, callback){
            burst.getAccount(accId,function(accData){
               if(accData.status === true){
                   block.relatedAccounts.push(accData.message);
               }
                callback();
            });
        },
        function(err){
            done();
        }
    );
}

function queryBlock(blkId, done){
    burst.getBlock(blkId, function(response){
        var block = response.message;
        block.transactionsData = [];
        async.parallel(
            {
                relatedBlock: function(callback){
                    getRelatedBlock(block,function(){
                        callback(null,null);
                    })
                },
                relatedTx: function(callback){
                    getRelatedTransaction(block, block.transactionsData, function(){
                        getRelatedAccount(block,function(){
                            callback(null,null);
                        });
                    });
                }
            },
            function(err, results){
                done(response);
            }
        );
    });
}

router.get('/:blkid', function(clientReq, clientRes) {
    try{
        var blkId = clientReq.params['blkid'];
        var cacheResult = burst.getBlockFromCache(blkId);
        if(cacheResult == null){
            queryBlock(blkId, function(response){
                var result = JSON.stringify(response);
                clientRes.send(result);
                burst.addBlockToCache(blkId, result);
            });
        }
        else {
            clientRes.send(cacheResult);
            console.log('block '+blkId+' sent from cache');
        }
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
