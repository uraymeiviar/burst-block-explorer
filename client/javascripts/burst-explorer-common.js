$.ajaxSetup({
    cache: true
});

var templateCache = [];
function getTemplate(path, callback){
    if(path in templateCache){
        callback(templateCache[path]);
    }
    else {
        $.get(path, function(template){
            templateCache[path] = template;
            callback(template);
        });
    }
}

function pageLoadBlock(blkid) {
    loadBlock(blkid,function(html){
        $('body').append(html);
    });
}

function pageLoadAccount(accId) {
    var accStr = accId.replace(/(^\s+)|(\s+$)/g, '').toUpperCase();
    if(accStr.indexOf('BURST-') == 0) {
        var nxt = new NxtAddress();
        if(nxt.set(accStr)){
            accStr = nxt.account_id();
        }
    }
    loadAccount(accStr,function(html){
        $('body').append(html);
    });
}

function pageLoadTransaction(txId) {
    loadTransaction(txId,function(html){
        $('body').append(html);
    });
}

$(document).ready(function(){
    initPageBlock();
    initPageAccount();
    initPageTransaction();
    var path = $(location)[0].pathname;
    var paths = path.split('/');
    if(paths[1].toLowerCase() == 'blk') {
        pageLoadBlock(paths[2]);
    }
    else if(paths[1].toLowerCase() == 'acc') {
        pageLoadAccount(paths[2]);
    }
    else if(paths[1].toLowerCase() == 'tx') {
        pageLoadTransaction(paths[2]);
    }
});

function satoshiToFloat(satoshi){
    return (satoshi/100000000).toFixed(2)
}

function floatToUnitStr(num){
    if(num >= 1000000000){
        return (num/1000000000).toFixed(2)+'G';
    }
    else if( num >= 1000000){
        return (num/1000000).toFixed(2)+'M';
    }
    else if( num >= 1000){
        return (num/1000).toFixed(2)+'K';
    }
    else{
        return num.toFixed(2);
    }
}