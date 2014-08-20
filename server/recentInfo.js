var express = require('express');
var request = require('request');
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

            var recentBlockCount = 10;
            if(respond.message.lastBlock < 10){
                recentBlockCount = respond.message.lastBlock;
            }

            burst.getRecentBlocks(respond.message.lastBlock, recentBlockCount, respond.message.blocks, function(){
                var accountList = [];
                var txList = [];

                for(var i=0; i<respond.message.blocks.length ; i++){
                    if(accountList.indexOf(respond.message.blocks[i].generator) == -1){
                        accountList.push(respond.message.blocks[i].generator);
                    }
                    for(var t=0 ; t<respond.message.blocks[i].transactions.length ; t++){
                        if(txList.indexOf(respond.message.blocks[i].transactions[t]) == -1){
                            txList.push(respond.message.blocks[i].transactions[t]);
                        }
                    }
                }

                burst.getTransactionList(txList, 0, respond.message.transactions, function(){
                   for(var n=0 ; n<respond.message.transactions.length ; n++){
                       if(accountList.indexOf(respond.message.transactions.sender) == -1){
                           accountList.push(respond.message.transactions[n].sender);
                       }
                       if(accountList.indexOf(respond.message.transactions.recipient) == -1){
                           accountList.push(respond.message.transactions[n].recipient);
                       }
                   }

                    burst.getAccountList(accountList, 0, respond.message.accounts, function(){
                       console.log(jsonFormat.render(accountList));
                       done(respond);
                   });
                });
            });
        }
    });
}

router.get('/', function(clientReq, clientRes) {
    getRecentInfo(function(response){
        clientRes.send(JSON.stringify(response));
    });
});

module.exports = router;
