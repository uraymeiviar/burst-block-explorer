var async       = require('async');
var jsonFormat  = require('prettyjson');
var burst       = require('./burstapi');
var fs          = require('fs');

/*
 1.120 records of diff      every blocks, hourly, daily, weekly, monthly
 2.120 records of tx amount every blocks, hourly, daily, weekly, monthly
 3.120 records of tx count  every blocks, hourly, daily, weekly, monthly
 4.top 100 account with most funds (richlist)
 5.top 100 account with most block generated (top miners)
 6.top 100 account with most transactions (most active account)
 7.top 100 transaction with highest amount
 8.top 100 fastest block generated
 9.top 100 longest block generated
 10.top 100 highest block diff
 11.top 100 lowest block diff
 12.price hourly, daily, weekly, monthly
 13.distribution of block generation time (<1 secs,10,20,..,>360)
 14.distribution of account balance (<1,1k,10k,100k,1m,10m,100m,1g,>1g)
 15.distribution of transaction amount (<1,1k,10k,100k,1m,10m,100m,1g,>1g)
 */

var burstStatDiff = {
    blocks : [], //last 180 blocks
    hourly : [], //last 168 (7 days  ) 1 record ~ 15 blocks
    daily  : [], //last  90 (3 months)
    weekly : [], //last  96 (2 years )
    monthly: []  //last  60 (5 years )
};

var burstStatTxAmount = {
    blocks : [], //last 180 blocks
    hourly : [], //last 168 (7 days  ) 1 record ~ 15 blocks
    daily  : [], //last  90 (3 months)
    weekly : [], //last  96 (2 years )
    monthly: []  //last  60 (5 years )
};

var burstStatTxCount = {
    blocks : [], //last 180 blocks
    hourly : [], //last 168 (7 days  ) 1 record ~ 15 blocks
    daily  : [], //last  90 (3 months)
    weekly : [], //last  96 (2 years )
    monthly: []  //last  60 (5 years )
};

var burstStat = {
    lastBlock       : 0,
    lastBlockId     : 0,
    diff            : burstStatDiff,
    txAmount        : burstStatTxAmount,
    txCount         : burstStatTxCount,
    accMostRich     : [],
    accTopMiners    : [],
    accMostActive   : [],
    txTopAmount     : [],
    blkFastest      : [],
    blkSlowest      : [],
    blkHighestDiff  : [],
    blkLowestDiff   : [],
    distBlkGenTime  : [], //0...360 (+10)
    distAccBalance  : [], //0...1G (x10)
    distTxAmount    : [],  //0...1G (x10)
    init : function() {
        for(var i=this.distBlkGenTime.length ; i<36 ; i++){
            this.distBlkGenTime.push(0);
        }
        for(var i=this.distAccBalance.length ; i<12 ; i++){
            this.distAccBalance.push(0);
        }
        for(var i=this.distTxAmount.length ; i<12 ; i++){
            this.distTxAmount.push(0);
        }
    }
};

function processDiffStat(block,done){
    function processDiffSeries(thisSeries, prevSeries, maxRecords, thisSeriesInterval){
        var recentItem = prevSeries[0];

        if(thisSeries.length <= 0){
            thisSeries.unshift(recentItem);
        }
        else {
            var secsDiff = recentItem.timestamp - thisSeries[0].timestamp;
            if(secsDiff > thisSeriesInterval){
                thisSeries.unshift(recentItem);
                if(thisSeries.length > maxRecords){
                    thisSeries.pop();
                }
            }
            else {
                var diffsum = 0;
                var ndx = 0;
                do{
                    secsDiff = recentItem.timestamp - prevSeries[ndx].timestamp
                    if(secsDiff < thisSeriesInterval){
                        diffsum += prevSeries[ndx].diff;
                        ndx++;
                    }
                }while( (secsDiff < thisSeriesInterval) && (ndx < prevSeries.length) );

                thisSeries[0].blockId    = recentItem.blockId;
                thisSeries[0].height     = recentItem.height;
                thisSeries[0].diff       = diffsum/parseFloat(ndx);
                thisSeries[0].timeLength = secsDiff;
            }
        }
    }

    var blockStatItem = {
        diff        : parseFloat(block.baseTarget),
        blockId     : block.blockId,
        blockHeight : block.height,
        timestamp   : block.timestamp,
        timeLength  : 0
    };
    burstStat.diff.blocks.unshift(blockStatItem);

    processDiffSeries(burstStat.diff.hourly , burstStat.diff.blocks, 168, 60*60);
    processDiffSeries(burstStat.diff.daily  , burstStat.diff.hourly,  90, 60*60*24);
    processDiffSeries(burstStat.diff.weekly , burstStat.diff.daily ,  96, 60*60*24*7);
    processDiffSeries(burstStat.diff.monthly, burstStat.diff.weekly, 120, 60*60*24*30);

    if(burstStat.diff.blocks.length > 180){
        burstStat.diff.blocks.pop();
    }
    done();
}

function processBlock(block, done){
    console.log('processing stat block#'+block.height+' '+block.blockId);
    burstStat.lastBlock   = block.height;
    burstStat.lastBlockId = block.blockId;
    processDiffStat(block, done);
}

function getStat(){
    return burstStat;
}

function walkBlock(block, done){
    if(block.status === true){
        processBlock(block.message, function(){
            if(block.message.hasOwnProperty('nextBlock')){
                burst.getFullBlock(block.message.nextBlock, function(block){
                    setTimeout(function(){walkBlock(block, done)},10);
                }, false);
            }
            else{
                done();
            }
        });
    }else {
        setTimeout(function(){walkBlock(block, done)},1000);
    }
}

function update(done){
    if(burst.getClientState().lastBlock == null){
        setTimeout(function(){update(done);},1000);
    }
    else{
        var latestBlock = burst.getClientState().lastBlock;
        if(burstStat.lastBlock < latestBlock.height){
            if(burstStat.lastBlockId == 0){
                burst.getFullBlock(burst.getClientState().constant.genesisBlockId, function(block){
                    walkBlock(block,done);
                }, false);
            }
            else {
                burst.getFullBlock(burstStat.lastBlockId, function(block){
                    walkBlock(block,done);
                }, false);
            }
        }
    }
}

function init(startFile){
    fs.readFile(startFile, function(err, data){
        if(err) {
            burstStat.init();
        }
        else {
            burstStat = JSON.parse(data);
        }
    });
}

module.exports = {
    getStat: getStat,
    update:update,
    init:init
};