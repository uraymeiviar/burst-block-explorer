var request = require('request');
var async   = require('async');
var jsonFormat      = require('prettyjson');

var txDataCache = {};
var accDataCache = {};
var blkDataCache = {};

var txDataCacheIndex = [];
var accDataCacheIndex = [];
var blkDataCacheIndex = [];

var maxCacheLen = 256;

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
                if( respond.message.hasOwnProperty('type') &&
                    respond.message.hasOwnProperty('subtype')){

                    var txType = respond.message.type;
                    var txSubType = respond.message.subtype;

                    if(BurstConfig.walletConstant.transactionTypes.indexOf(txType) != -1){
                        respond.message.type = BurstConfig.walletConstant.transactionTypes[txType].description;
                        respond.message.subtype = BurstConfig.walletConstant.transactionTypes[txType].subtypes[txSubType].description;
                    }
                    else {
                        respond.message.type = 'unknown';
                        respond.message.subtype = 'unknown';
                    }
                    respond.message.genesisTimestamp = BurstConfig.genesisBlockTimestamp;
                }
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


function updateCacheByNewBlock(blkId){
    clearAccountCache();
    /*
    queryBlock(blkId, function(response){
        var result = JSON.stringify(response);
        addBlockToCache(blkId, result);
        for(var i=0 ; i<response.message.relatedAccounts.length ; i++){
            removeAccountFromCache(response.message.relatedAccounts[i]);
        }
    });
    */
}

function updateRecentState(burst){
    try{
        getState(function(state){
            if(state.status === true){
                var oldBlock = '';
                if(burst.state != null){
                    oldBlock = burst.state.lastBlock;
                }
                burst.state = state.message;
                if(oldBlock != burst.state.lastBlock){
                    burst.recentInfoCache = null;
                    burst.getBlock(burst.state.lastBlock, function(block){
                        if(block.status === true){
                            burst.lastBlock = block.message;
                            updateCacheByNewBlock(block.message.blockId);
                            console.log('block #'+block.message.height+' '+block.message.blockId+' '+block.message.timestamp+' '+block.message.transactions.length+'tx(s)');
                        }
                    })
                }
            }
        });
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
}

function addBlockToCache(blkId, data){
    if(blkDataCache.hasOwnProperty(blkId)){
        blkDataCache[blkId] = data;
        console.log('block '+blkId+' cache updated');
    }
    else {
        blkDataCache[blkId] = data;
        var newLen = blkDataCacheIndex.push(blkId);
        console.log('block '+blkId+' added to cache');
        if(newLen > maxCacheLen){
            var idToRemove = blkDataCacheIndex.shift();
            delete blkDataCache[idToRemove];
            console.log('block '+idToRemove+' removed from cache');
        }
    }
}

function removeBlockFromCache(blkId){
    var index = blkDataCacheIndex.indexOf(blkId);
    if(index >= 0){
        blkDataCacheIndex.splice(index,1);
    }
    delete blkDataCache[blkId];
}

function getBlockFromCache(blkId){
    if(blkDataCache.hasOwnProperty(blkId)){
        return blkDataCache[blkId];
    }
    else{
        return null;
    }
}

function addTxToCache(txId, data){
    if(txDataCache.hasOwnProperty(txId)){
        txDataCache[txId] = data;
        console.log('tx '+txId+' cache updated');
    }
    else {
        txDataCache[txId] = data;
        var newLen = txDataCacheIndex.push(txId);
        console.log('tx '+txId+' added to cache');
        if(newLen > maxCacheLen){
            var idToRemove = txDataCacheIndex.shift();
            delete txDataCache[idToRemove];
            console.log('tx '+idToRemove+' removed from cache');
        }
    }
}

function removeTxFromCache(txId){
    var index = txDataCacheIndex.indexOf(txId);
    if(index >= 0){
        txDataCacheIndex.splice(index,1);
    }
    delete txDataCache[txId];
}

function getTxFromCache(txId){
    if(txDataCache.hasOwnProperty(txId)){
        return txDataCache[txId];
    }
    else{
        return null;
    }
}

function addAccountToCache(accId, data){
    if(accDataCache.hasOwnProperty(accId)){
        accDataCache[accId] = data;
        console.log('tx '+accId+' cache updated');
    }
    else {
        accDataCache[accId] = data;
        var newLen = accDataCacheIndex.push(accId);
        console.log('tx '+accId+' added to cache');
        if(newLen > maxCacheLen){
            var idToRemove = accDataCacheIndex.shift();
            delete accDataCache[idToRemove];
            console.log('tx '+idToRemove+' removed from cache');
        }
    }
}

function removeAccountFromCache(accId){
    var index = txDataCacheIndex.indexOf(accId);
    if(index >= 0){
        accDataCacheIndex.splice(index,1);
    }
    delete accDataCache[accId];
}

function getAccountFromCache(accId){
    if(accDataCache.hasOwnProperty(accId)){
        return accDataCache[accId];
    }
    else{
        return null;
    }
}

function clearAccountCache(){
    accDataCache = {};
    accDataCacheIndex = [];
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
    update : updateRecentState,
    recentInfoCache : null,
    addBlockToCache : addBlockToCache,
    removeBlockFromCache : removeBlockFromCache,
    getBlockFromCache : getBlockFromCache,
    addTxToCache : addTxToCache,
    removeTxFromCache : removeTxFromCache,
    getTxFromCache : getTxFromCache,
    addAccountToCache : addAccountToCache,
    removeAccountFromCache : removeAccountFromCache,
    getAccountFromCache : getAccountFromCache
};







