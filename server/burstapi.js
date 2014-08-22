var request = require('request');
var async   = require('async');

function getAccountTx(accId, blocktime, done){
    request.post({
        url:BurstConfig.walletUrl,
        form:{
            requestType:'getAccountTransactionIds',
            account: accId,
            timestamp: blocktime
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

function getAccountBlockGen(accId, blocktime, done){
    request.post({
        url:BurstConfig.walletUrl,
        form:{
            requestType:'getAccountBlockIds',
            account: accId,
            timestamp: blocktime
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


function getState(done){
    request.post({
        url:BurstConfig.walletUrl,
        form:{
            requestType:'getState'
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
                var txType = respond.message.type;
                var txSubType = respond.message.subtype;
                respond.message.type = BurstConfig.walletConstant.transactionTypes[txType].description;
                respond.message.subtype = BurstConfig.walletConstant.transactionTypes[txType].subtypes[txSubType].description;
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

function getTransactionListOutOfOrder(txList, target, done){
    async.each(txList,
        function(tx, callback){
            getTransaction(tx, function(txData){
                target.push(txData.message);
                callback();
            });
        },
        function(err){
            done();
        }
    );
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

function getAccountListOutOfOrder(accList, target, done){
    async.each(accList,
        function(acc, callback){
            getAccount(acc, function(accData){
                target.push(accData.message);
                callback();
            });
        },
        function(err){
            done();
        }
    );
}

function updateRecentState(burst){
    getState(function(state){
        if(state.status === true){
            var oldBlock = '';
            if(burst.state != null){
                oldBlock = burst.state.lastBlock;
            }
            burst.state = state.message;
            if(oldBlock != burst.state.lastBlock){
                burst.getBlock(burst.state.lastBlock, function(block){
                    if(block.status === true){
                        burst.lastBlock = block.message;
                        console.log('block #'+block.message.height+' '+block.message.blockId+' '+block.message.timestamp+' '+block.message.transactions.length+'tx(s)');
                    }
                })
            }
        }
    });
}

module.exports = {
    getAccountList : getAccountList,
    getAccountTx : getAccountTx,
    getAccountBlockGen : getAccountBlockGen,
    getTransactionList : getTransactionList,
    getTransactionListOutOfOrder : getTransactionListOutOfOrder,
    getAccountListOutOfOrder : getAccountListOutOfOrder,
    getRecentBlocks : getRecentBlocks,
    getAccount : getAccount,
    getTransaction : getTransaction,
    getBlock : getBlock,
    getBlockChainStatus : getBlockChainStatus,
    state : null,
    lastBlock : null,
    update : updateRecentState
};







