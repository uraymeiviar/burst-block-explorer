var express = require('express');
var request = require('request');
var async   = require('async');
var jsonFormat      = require('prettyjson');
var router = express.Router();
var burst = require('./burstapi');

function getRecentInfo(done){
    burst.getBlockChainStatus(function(blocckchainStatus){
        var respond = {
            status : true,
            message : {
                blockchainInfo : blocckchainStatus.message,
                blocks : [],
                transactions : [],
                accounts : []
            }
        };

        if(blocckchainStatus.status === true){
            respond.message.lastHeight = blocckchainStatus.message.numberOfBlocks;
            respond.message.lastBlock  = blocckchainStatus.message.lastBlock;

            var recentBlockCount = 15;
            if(respond.message.lastBlock < 15){
                recentBlockCount = respond.message.lastBlock;
            }

            burst.getRecentBlocks(respond.message.lastBlock, recentBlockCount, respond.message.blocks, function(){
                var accountList = [];
                var txList = [];

                async.each(respond.message.blocks,
                    function(block, callback){
                        if(accountList.indexOf(block.generator) == -1){
                            accountList.push(block.generator);
                            //console.log('acc '+block.generator+' gen blk'+block.height);
                        }
                        for(var t=0 ; t<block.transactions.length ; t++){
                            if(txList.indexOf(block.transactions[t]) == -1){
                                txList.push(block.transactions[t]);
                            }
                        }
                        callback();
                    },
                    function(err){
                        burst.getTransactionListOutOfOrder(txList, respond.message.transactions, function(){
                            async.each(respond.message.transactions,
                                function(tx, callback){
                                    if(accountList.indexOf(tx.sender) == -1){
                                        accountList.push(tx.sender);
                                        //console.log('acc '+tx.sender+' sender tx '+tx.transaction);
                                    }
                                    if(accountList.indexOf(tx.recipient) == -1){
                                        accountList.push(tx.recipient);
                                        //console.log('acc '+tx.recipient+' recipient tx '+tx.transaction);
                                    }
                                    callback();
                                },
                                function(err){
                                    burst.getAccountListOutOfOrder(accountList, respond.message.accounts, function(){
                                        done(respond);
                                    });
                                }
                            );
                        });
                    }
                );
            });
        }
    });
}

router.get('/', function(clientReq, clientRes) {
    try{
        if(burst.recentInfoCache != null){
            clientRes.send(burst.recentInfoCache);
        }
        else {
            getRecentInfo(function(response){
                response.message.transactions.sort(function(a,b){
                   return b.timestamp - a.timestamp;
                });
                var result = JSON.stringify(response);
                clientRes.setHeader('Cache-Control', 'no-cache');
                clientRes.send(result);
                burst.recentInfoCache =  result;
            });
        }
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
