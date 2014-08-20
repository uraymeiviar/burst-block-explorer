var express = require('express');
var request = require('request');
var jsonFormat      = require('prettyjson');
var router = express.Router();

function getBlockChainStatus(done){
    request.post({
        url:BurstConfig.walletUrl,
        form:{
            requestType:'getBlockchainStatus'
        }
    }, function(error, res, body){
        var respond = {
            status : true,
            message : null
        };
        if (!error && res.statusCode == 200) {
            respond.message = JSON.parse(body);
        }
        else {
            respond.status  = false;
            respond.message = 'wallet error, '+res.statusCode;
        }
        done(respond);
    });
}

function getBlock(blockid, done){
    request.post(
        {
            url:BurstConfig.walletUrl,
            form: {
                requestType:'getBlock',
                block:blockid
            }
        },
        function(error, res, body){
            var respond = {
                status : true,
                message : null
            };
            if (!error && res.statusCode == 200) {
                respond.message = JSON.parse(body);
                respond.message.genesisTimestamp = BurstConfig.genesisBlockTimestamp;
                respond.message.blockId = blockid;
            }
            else {
                respond.status  = false;
                respond.message = 'wallet error, '+res.statusCode;
            }
            done(respond);
        }
    );
}

function getTransaction(txid, done){
    request.post(
        {
            url:BurstConfig.walletUrl,
            form: {
                requestType:'getTransaction',
                transaction:txid
            }
        },
        function(error, res, body){
            var respond = {
                status : true,
                message : null
            };
            if (!error && res.statusCode == 200) {
                respond.message = JSON.parse(body);
                respond.message.genesisTimestamp = BurstConfig.genesisBlockTimestamp;
            }
            else {
                respond.status  = false;
                respond.message = 'wallet error, '+res.statusCode;
            }
            done(respond);
        }
    );
}

function getAccount(accid, done){
    request.post(
        {
            url:BurstConfig.walletUrl,
            form: {
                requestType:'getAccount',
                account:accid
            }
        },
        function(error, res, body){
            var respond = {
                status : true,
                message : null
            };
            if (!error && res.statusCode == 200) {
                respond.message = JSON.parse(body);
                respond.message.genesisTimestamp = BurstConfig.genesisBlockTimestamp;
            }
            else {
                respond.status  = false;
                respond.message = 'wallet error, '+res.statusCode;
            }
            done(respond);
        }
    );
}

function getRecentBlocks(blockId, count, target, done){
    function pushRecentBlock(target, count,  block){
        target.push(block);
        if(target.length+1 < count){
            getRecentBlocks(block.previousBlock, count, target, done);
        }
        else{
            done();
        }
    }
    getBlock(blockId, function(block){
        if(block.status === true){
            pushRecentBlock(target, count, block.message);
        }
    });
}

function getTransactionList(txList, startIndex, target, done){
    function pushTransactionItem(target, nextIndex,  tx){
        target.push(tx);
        if(nextIndex < txList.length){
            getTransactionList(txList, nextIndex, target, done);
        }
        else{
            done();
        }
    }
    getTransaction(txList[startIndex], function(tx){
        if(tx.status === true){
            pushTransactionItem(target, startIndex+1, tx.message);
        }
        else{
            if(startIndex+1 < txList.length){
                getTransactionList(txList, startIndex+1, target, done);
            }
        }
    });
}

function getAccountList(accList, startIndex, target, done){
    function pushAccountItem(target, nextIndex,  acc){
        target.push(acc);
        if(nextIndex < accList.length){
            getAccountList(accList, nextIndex, target, done);
        }
        else{
            done();
        }
    }
    getAccount(accList[startIndex], function(acc){
        if(acc.status === true){
            pushAccountItem(target, startIndex+1, acc.message);
        }
        else{
            if(startIndex+1 < accList.length){
                getAccountList(accList, startIndex+1, target, done);
            }
        }
    });
}

function getRecentInfo(done){
    getBlockChainStatus(function(blocckchainStatus){
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

            getRecentBlocks(respond.message.lastBlock, recentBlockCount, respond.message.blocks, function(){
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

                getTransactionList(txList, 0, respond.message.transactions, function(){
                   for(var n=0 ; n<respond.message.transactions.length ; n++){
                       if(accountList.indexOf(respond.message.transactions.sender) == -1){
                           accountList.push(respond.message.transactions[n].sender);
                       }
                       if(accountList.indexOf(respond.message.transactions.recipient) == -1){
                           accountList.push(respond.message.transactions[n].recipient);
                       }
                   }

                   getAccountList(accountList, 0, respond.message.accounts, function(){
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
