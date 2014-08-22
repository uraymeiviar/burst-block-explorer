var express = require('express');
var request = require('request');
var burst = require('./burstapi');
var async   = require('async');
var jsonFormat      = require('prettyjson');
var router = express.Router();

function getAccountRecentTxLoop(accId, queryTimestamp, count, target, done){
    burst.getAccountTx(accId, queryTimestamp, function(txListData){
        if(txListData.status === true){
            if(txListData.message.hasOwnProperty('transactionIds')){
                for(var i=0 ; i<txListData.message.transactionIds.length ; i++){
                    if(target.indexOf(txListData.message.transactionIds[i]) == -1){
                        target.push(txListData.message.transactionIds[i]);
                    }
                    if(target.length >= count){
                        done();
                        return;
                    }
                }
                if(target.length < count){
                    if(queryTimestamp > 0 ){
                        var nextTimestamp =  queryTimestamp;
                        var half = parseInt(queryTimestamp/2);
                        if(half == 0){
                            nextTimestamp = 0;
                        }
                        else {
                            nextTimestamp = queryTimestamp - half;
                            if(nextTimestamp < 60*60*24){
                                nextTimestamp = 0;
                            }
                        }
                        getAccountRecentTxLoop(accId, nextTimestamp, count, target, done);
                    }
                    else{
                        done();
                    }
                }
            }
            else{
                done();
            }
        }
        else {
            done();
        }
    });
}

function getAccountBlockGenLoop(accId, queryTimestamp, count, target, done){
    burst.getAccountBlockGen(accId, queryTimestamp, function(blockIdData){
        if(blockIdData.status === true){
            if(blockIdData.message.hasOwnProperty('blockIds')){
                for(var i=0 ; i<blockIdData.message.blockIds.length ; i++){
                    if(target.indexOf(blockIdData.message.blockIds[i]) == -1){
                        target.push(blockIdData.message.blockIds[i]);
                    }
                    if(target.length >= count){
                        done();
                        return;
                    }
                }
                if(target.length < count){
                    if(queryTimestamp > 0 ){
                        var nextTimestamp =  queryTimestamp;
                        var half = parseInt(queryTimestamp/2);
                        if(half == 0){
                            nextTimestamp = 0;
                        }
                        else {
                            nextTimestamp = queryTimestamp - half;
                            if(nextTimestamp < 60*60*24){
                                nextTimestamp = 0;
                            }
                        }
                        getAccountBlockGenLoop(accId, nextTimestamp, count, target, done);
                    }
                    else{
                        done();
                    }
                }
            }
            else{
                done();
            }
        }
        else {
            done();
        }
    });
}

function getAccountRecentTx(accId, count, target, done){
    var recentBlockTimestamp = burst.lastBlock.timestamp;
    var queryTimestamp = recentBlockTimestamp - (60*60*24*7);
    if(queryTimestamp < 0 ){
        queryTimestamp = 0;
    }
    var txList = [];

    getAccountRecentTxLoop(accId, queryTimestamp, count, txList, function(){
        if(txList.length > 0){
            async.each(txList,
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
        else {
            done();
        }
    });
}

function getAccountBlockGen(accId, count, target, done){
    var recentBlockTimestamp = burst.lastBlock.timestamp;
    var queryTimestamp = recentBlockTimestamp - (60*60*24*7);
    if(queryTimestamp < 0 ){
        queryTimestamp = 0;
    }
    var blockList = [];

    getAccountBlockGenLoop(accId, queryTimestamp, count, blockList, function(){
        if(blockList.length > 0){
            async.each(blockList,
                function(blockId, callback){
                    burst.getBlock(blockId, function(blockData){
                        if(blockData.status === true){
                            target.push(blockData.message);
                        }
                        callback();
                    });
                },
                function(err){
                    done();
                }
            );
        }
        else {
            done();
        }
    });
}

router.get('/:accid', function(clientReq, clientRes) {
    try{
        var accId = clientReq.params['accid'];
        var cacheData = burst.getAccountFromCache(accId);
        if(cacheData == null){
            burst.getAccount(accId, function(response){
                response.message.recentTx = [];
                response.message.blockGenerated = [];

                async.parallel(
                    {
                        relatedTx: function(callback){
                            getAccountRecentTx(accId,20,response.message.recentTx, function(){
                                callback(null, null);
                            });
                        },
                        relatedBlock: function(callback){
                            getAccountBlockGen(accId,20,response.message.blockGenerated, function(){
                                callback(null, null);
                            });
                        }
                    },
                    function(err, results){
                        var result = JSON.stringify(response);
                        clientRes.send(result);
                        burst.addAccountToCache(accId, result);
                    }
                );
            });
        }
        else {
            clientRes.send(cacheData);
            console.log('account '+accId+' sent from cache');
        }
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
