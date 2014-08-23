var request = require('request');
var async   = require('async');
var jsonFormat      = require('prettyjson');
var blockchainData = {
    txDataCache : {},
    accDataCache : {},
    blkDataCache : {},

    txDataCacheIndex : [],
    accDataCacheIndex : [],
    blkDataCacheIndex : [],

    lastBlock : null,
    state: null,
    recentInfoCache : null,
    maxCacheLen : 64
};

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

function getRelatedBlockFromBlock(block, done){
    async.parallel(
        {
            prev: function(callback){
                if (block.hasOwnProperty('previousBlock')) {
                    getBlock(block.previousBlock, function (prevBlock) {
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
                    getBlock(block.nextBlock, function (nextBlock) {
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
            block.previousBlockData = JSON.parse(JSON.stringify(results.prev));
            block.nextBlockData = JSON.parse(JSON.stringify(results.next));
            done();
        }
    );
}

function getRelatedTxFromBlock(block, done){
    if(!block.hasOwnProperty('transactionsData')){
        block.transactionsData = [];
    }
    if( block.hasOwnProperty('transactions') &&
        block.transactions.length > 0){
        async.each(block.transactions,
            function(txid, callback){
                getTransaction(txid, function(txData){
                    if(txData.status === true){
                        var txJson = JSON.stringify(txData.message);
                        block.transactionsData.push(JSON.parse(txJson));
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

function getRelatedAccountFromBlock(block, done){
    if(!block.hasOwnProperty('relatedAccounts')){
        block.relatedAccounts = [];
    }

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

    async.each(accList,
        function(accId, callback){
            getAccount(accId,function(accData){
                if(accData.status === true){
                    var accJson = JSON.stringify(accData.message);
                    block.relatedAccounts.push(JSON.parse(accJson));
                }
                callback();
            });
        },
        function(err){
            done();
        }
    );
}

function getRelatedDataFromBlock(block, done){
    block.transactionsData = [];
    async.parallel(
        {
            relatedBlock: function(callback){
                getRelatedBlockFromBlock(block,function(){
                    callback(null,null);
                })
            },
            relatedTx: function(callback){
                getRelatedTxFromBlock(block, function(){
                    getRelatedAccountFromBlock(block,function(){
                        callback(null,null);
                    });
                });
            }
        },
        function(err, results){
            done();
        }
    );
}

function getFullBlock(blockid, done){
    getBlock(blockid,function(respond){
        getRelatedDataFromBlock(respond.message, function(){
            done(respond);
        })
    });
}

function getBlock(blockid, done){
    var cacheResult = getBlockFromCache(blockid);
    if(cacheResult == null){
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
                    addBlockToCache(blockid, respond.message);
                }
                else {
                    respond.status  = false;
                    respond.message = 'wallet error, '+res.statusCode;
                }
                done(respond);
            }
        );
    }
    else{
        var respond = {
            status : true,
            message : cacheResult
        };
        done(respond);
        console.log('block '+blockid+' read from cache');
    }
}

function getRelatedAccountFromTx(tx, done){
    async.parallel(
        {
            sender: function(callback){
                getAccount(tx.sender, function(acc){
                    if(acc.status === true){
                        tx.senderData = JSON.parse(JSON.stringify(acc.message));
                    }
                    callback();
                });
            },
            recipient : function(callback){
                getAccount(tx.recipient, function(acc){
                    if(acc.status === true){
                        tx.recipientData = JSON.parse(JSON.stringify(acc.message));
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

function getRelatedDataFromTx(tx, done){
    async.parallel(
        {
            account : function(callback){
                getRelatedAccountFromTx(tx, function(){
                    callback();
                });
            },
            block : function(callback){
                getBlock(tx.block, function(block){
                    if(block.status === true){
                        tx.blockData = JSON.parse(JSON.stringify(block.message));
                    }
                    callback();
                })
            }
        },
        function(err, results){
            done();
        }
    );
}

function getFullTransaction(txid, done){
    getTransaction(txid, function(respond){
        getRelatedDataFromTx(respond.message, function(){
           done(respond);
        });
    });
}

function getTransaction(txid, done){
    var cacheData = getTxFromCache(txid);
    if(cacheData == null){
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

                        if(BurstConfig.walletConstant.transactionTypes.hasOwnProperty(txType)){
                            respond.message.type = BurstConfig.walletConstant.transactionTypes[txType].description;
                            if(BurstConfig.walletConstant.transactionTypes[txType].subtypes.hasOwnProperty(txSubType)){
                                respond.message.subtype = BurstConfig.walletConstant.transactionTypes[txType].subtypes[txSubType].description;
                            }
                            else{
                                respond.message.subtype = 'unknown';
                            }
                        }
                        else {
                            respond.message.type = 'unknown';
                            respond.message.subtype = 'unknown';
                        }
                        respond.message.genesisTimestamp = BurstConfig.genesisBlockTimestamp;
                    }
                    addTxToCache(txid,respond.message);
                }
                else {
                    respond.status  = false;
                    respond.message = 'wallet error, '+res.statusCode;
                }
                done(respond);
            }
        );
    }
    else{
        var respond = {
            status : true,
            message : cacheData
        };
        done(respond);
        console.log('tx '+txid+' read from cache');
    }
}

function getBlocksGeneratedByAccountLoop(accId, queryTimestamp, count, target, done){
    getAccountBlockGen(accId, queryTimestamp, function(blockIdData){
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
                        getBlocksGeneratedByAccountLoop(accId, nextTimestamp, count, target, done);
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

function getBlocksGeneratedByAccount(accId, count, target, done){
    if(blockchainData.lastBlock == null){
        done();
        return;
    }
    var recentBlockTimestamp = blockchainData.lastBlock.timestamp;
    var queryTimestamp = recentBlockTimestamp - (60*60*24*7);
    if(queryTimestamp < 0 ){
        queryTimestamp = 0;
    }
    var blockList = [];

    getBlocksGeneratedByAccountLoop(accId, queryTimestamp, count, blockList, function(){
        if(blockList.length > 0){
            async.each(blockList,
                function(blockId, callback){
                    getBlock(blockId, function(blockData){
                        if(blockData.status === true){
                            var blkJson = JSON.stringify(blockData.message);
                            target.push(JSON.parse(blkJson));
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

function getRecentTxByAccountLoop(accId, queryTimestamp, count, target, done){
    getAccountTx(accId, queryTimestamp, function(txListData){
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
                        getRecentTxByAccountLoop(accId, nextTimestamp, count, target, done);
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

function getRecentTxByAccount(accId, count, target, done){
    if(blockchainData.lastBlock == null){
        done();
        return;
    }
    var recentBlockTimestamp = blockchainData.lastBlock.timestamp;
    var queryTimestamp = recentBlockTimestamp - (60*60*24*7);
    if(queryTimestamp < 0 ){
        queryTimestamp = 0;
    }
    var txList = [];

    getRecentTxByAccountLoop(accId, queryTimestamp, count, txList, function(){
        if(txList.length > 0){
            async.each(txList,
                function(txid, callback){
                    getTransaction(txid, function(txData){
                        if(txData.status === true){
                            var txJson = JSON.stringify(txData.message);
                            target.push(JSON.parse(txJson));
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

function getRelatedDataFromAccount(acc, done){
    if(!acc.hasOwnProperty('recentTx')){
        acc.recentTx = [];
    }
    if(!acc.hasOwnProperty('blockGenerated')){
        acc.blockGenerated = [];
    }
    async.parallel(
        {
            relatedTx: function(callback){
                getRecentTxByAccount(acc.account,20,acc.recentTx, function(){
                    acc.recentTx.sort(function(a,b){
                        return b.timestamp - a.timestamp;
                    });
                    callback(null, null);
                });
            },
            relatedBlock: function(callback){
                getBlocksGeneratedByAccount(acc.account,20,acc.blockGenerated, function(){
                    acc.blockGenerated.sort(function(a,b){
                        return b.timestamp - a.timestamp;
                    });
                    callback(null, null);
                });
            }
        },
        function(err, results){
            done();
        }
    );
}

function getFullAccount(accid, done){
    getAccount(accid, function(response){
       getRelatedDataFromAccount(response.message, function(){
           done(response);
       })
    });
}

function getAccount(accid, done){
    var cacheData = getAccountFromCache(accid);
    if(cacheData == null){
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
                addAccountToCache(accid,respond.message);
            }
        );
    }
    else{
        var respond = {
            status : true,
            message : cacheData
        };
        done(respond);
        console.log('account '+accid+' read from cache');
    }
}

function getRecentBlocks(blockId, count, target, done){
    function pushRecentBlock(target, count,  block){
        if(target.length > 0){
            target[target.length-1].previousBlockData = block;
            block.nextBlockData = JSON.parse(JSON.stringify(target[target.length-1]));
        }
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
    clearTxCache();

    getFullBlock(blkId,function(respond){
        var block = respond.message;
        for(var i=0 ; i<block.relatedAccounts.length ; i++){
            removeAccountFromCache(block.relatedAccounts[i].account);
        }
    });
}

function updateRecentState(){
    try{
        getState(function(state){
            if(state.status === true){
                var oldBlock = '';
                if(getClientState().state != null){
                    oldBlock = getClientState().state.lastBlock;
                }
                getClientState().state = state.message;
                if(oldBlock != getClientState().state.lastBlock){
                    getClientState().recentInfoCache = null;
                    getBlock(getClientState().state.lastBlock, function(block){
                        if(block.status === true){
                            getClientState().lastBlock = block.message;
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
    if(getClientState().blkDataCache.hasOwnProperty(blkId)){
        getClientState().blkDataCache[blkId] = data;
        console.log('block '+blkId+' cache updated ('+getClientState().blkDataCacheIndex.length+')');
    }
    else {
        getClientState().blkDataCache[blkId] = data;
        var newLen = getClientState().blkDataCacheIndex.push(blkId);
        console.log('block '+blkId+' added to cache ('+getClientState().blkDataCacheIndex.length+')');
        if(newLen > getClientState().maxCacheLen){
            var idToRemove = getClientState().blkDataCacheIndex.shift();
            delete getClientState().blkDataCache[idToRemove];
            console.log('block '+idToRemove+' removed from cache ('+getClientState().blkDataCacheIndex.length+')');
        }
    }
}

function removeBlockFromCache(blkId){
    var index = getClientState().blkDataCacheIndex.indexOf(blkId);
    if(index >= 0){
        getClientState().blkDataCacheIndex.splice(index,1);
    }
    delete getClientState().blkDataCache[blkId];
    console.log('block '+blkId+' removed from cache ('+getClientState().blkDataCacheIndex.length+')');
}

function getBlockFromCache(blkId){
    if(blockchainData.blkDataCache.hasOwnProperty(blkId)){
        return blockchainData.blkDataCache[blkId];
    }
    else{
        return null;
    }
}

function addTxToCache(txId, data){
    if(getClientState().txDataCache.hasOwnProperty(txId)){
        getClientState().txDataCache[txId] = data;
        console.log('tx '+txId+' cache updated ('+getClientState().txDataCacheIndex.length+')');
    }
    else {
        getClientState().txDataCache[txId] = data;
        var newLen = getClientState().txDataCacheIndex.push(txId);
        console.log('tx '+txId+' added to cache ('+getClientState().txDataCacheIndex.length+')');
        if(newLen > getClientState().maxCacheLen){
            var idToRemove = getClientState().txDataCacheIndex.shift();
            delete getClientState().txDataCache[idToRemove];
            console.log('tx '+idToRemove+' removed from cache ('+getClientState().txDataCacheIndex.length+')');
        }
    }
}

function removeTxFromCache(txId){
    var index = getClientState().txDataCacheIndex.indexOf(txId);
    if(index >= 0){
        getClientState().txDataCacheIndex.splice(index,1);
    }
    delete getClientState().txDataCache[txId];
    console.log('tx '+txId+' removed from cache ('+getClientState().txDataCacheIndex.length+')');
}

function getTxFromCache(txId){
    if(getClientState().txDataCache.hasOwnProperty(txId)){
        return getClientState().txDataCache[txId];
    }
    else{
        return null;
    }
}

function clearTxCache(){
    getClientState().txDataCache = {};
    getClientState().txDataCacheIndex = [];
}

function addAccountToCache(accId, data){
    if(getClientState().accDataCache.hasOwnProperty(accId)){
        getClientState().accDataCache[accId] = data;
        console.log('account '+accId+' cache updated ('+getClientState().accDataCacheIndex.length+')');
    }
    else {
        getClientState().accDataCache[accId] = data;
        var newLen = getClientState().accDataCacheIndex.push(accId);
        console.log('account '+accId+' added to cache ('+getClientState().accDataCacheIndex.length+')');
        if(newLen > getClientState().maxCacheLen){
            var idToRemove = getClientState().accDataCacheIndex.shift();
            delete getClientState().accDataCache[idToRemove];
            console.log('account '+idToRemove+' removed from cache ('+getClientState().accDataCacheIndex.length+')');
        }
    }
}

function removeAccountFromCache(accId){
    var index = getClientState().txDataCacheIndex.indexOf(accId);
    if(index >= 0){
        getClientState().accDataCacheIndex.splice(index,1);
    }
    delete getClientState().accDataCache[accId];
    console.log('account '+accId+' removed from cache ('+getClientState().accDataCacheIndex.length+')');
}

function getAccountFromCache(accId){
    if(getClientState().accDataCache.hasOwnProperty(accId)){
        return getClientState().accDataCache[accId];
    }
    else{
        return null;
    }
}

function clearAccountCache(){
    getClientState().accDataCache = {};
    getClientState().accDataCacheIndex = [];
}

function getClientState() {
    return blockchainData;
}

module.exports = {
    getClientState : getClientState,
    getAccountList : getAccountList,
    getAccountTx : getAccountTx,
    getAccountBlockGen : getAccountBlockGen,
    getTransactionList : getTransactionList,
    getTransactionListOutOfOrder : getTransactionListOutOfOrder,
    getAccountListOutOfOrder : getAccountListOutOfOrder,
    getRecentBlocks : getRecentBlocks,
    getAccount : getAccount,
    getFullAccount : getFullAccount,
    getTransaction : getTransaction,
    getFullTransaction : getFullTransaction,
    getBlock : getBlock,
    getFullBlock : getFullBlock,
    getBlockChainStatus : getBlockChainStatus,
    update : updateRecentState,
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







