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
        preprocessBlkData(data.blockData);
        preprocessAccData(data.senderData);
        preprocessAccData(data.recipientData);
        done(Mustache.render(template, data));

        var snederQr = $('#AccountQR-'+data.senderData.account);
        snederQr.qrcode({
            "size": parseInt(snederQr.innerHeight()),
            "fill": "#30DA7B",
            "render": "div",
            "text": data.senderData.accountRS
        });

        var recipientQr = $('#AccountQR-'+data.recipientData.account);
        recipientQr.qrcode({
            "size": parseInt(recipientQr.innerHeight()),
            "fill": "#30DA7B",
            "render": "div",
            "text": data.recipientData.accountRS
        });
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