function loadTransaction(txid, done ){
    $.get('/api/tx/'+txid, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderTransactionHtml(txid,respond.message,done);
        }
    });
}

function preprocessTxData(data){
    data.TXID = data.transaction;
    data.PAGE_TITLE = 'Transaction';
    data.amountNQTStr = satoshiToFloat(data.amountNQT);
    data.amountNQTStrUnit = floatToUnitStr(parseFloat(data.amountNQTStr));
    data.feeNQTStr = satoshiToFloat(data.feeNQT);
    data.unixTimestamp = parseInt(data.timestamp)*1000 + parseInt(data.genesisTimestamp);
    data.timeString = moment(data.unixTimestamp).format("ddd, MMM Do YYYY, HH:mm:ss");
    data.timeStringDelta = moment(data.unixTimestamp).fromNow();
}

function renderTransactionHtml(txid,data, done) {
    getTemplate('/templates/transaction.template', function(template) {
        preprocessTxData(data);
        console.log(data);
        done(Mustache.render(template, data));
    });
}

function initPageTransaction() {
    var root = $('body');
    root.on('click','.TxContentBtn',function(event) {
        var id = event.target.id;
        var txid = id.split('-')[1];
        $('#TransactionDetail-' + txid).toggle();
    });
}