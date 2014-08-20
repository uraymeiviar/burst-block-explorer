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
        $('#content').append(html);
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
        $('#content').append(html);
    });
}

function pageLoadTransaction(txId) {
    loadTransaction(txId,function(html){
        $('#content').append(html);
    });
}

function renderIndexHtml(data, done){
    getTemplate('/templates/index.template', function(template) {
        done(Mustache.render(template, data));
    });
}

function pageLoadIndex(){
    $.get('/api/recent', function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            for(var i=0; i<respond.message.blocks.length ; i++){
                preprocessBlkData(respond.message.blocks[i]);
            }
            for(var i=0 ; i<respond.message.transactions.length ; i++){
                preprocessTxData(respond.message.transactions[i]);
            }
            for(var i=0 ; i<respond.message.accounts.length ; i++){
                preprocessAccData(respond.message.accounts[i]);
            }
            renderIndexHtml(respond.message,function(html){
                $('#content').append(html);

                for(var i=0 ; i<respond.message.accounts.length ; i++){
                    var qrArea = $('#AccountQR-'+respond.message.accounts[i].account);
                    qrArea.qrcode({
                        "size": parseInt(qrArea.innerHeight()),
                        "fill": "#30DA7B",
                        "render": "div",
                        "text": respond.message.accounts[i].accountRS
                    });
                }
            });
        }
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
    else {
        pageLoadIndex();
    }
});

function satoshiToFloat(satoshi){
    return (satoshi/100000000).toFixed(2)
}

function floatToUnitStr(num){
    if( (typeof num) == 'undefined'){
        return '--';
    }
    if( isNaN(num)){
        return '--';
    }
    try{
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
    catch(e){
        return '--';
    }
}