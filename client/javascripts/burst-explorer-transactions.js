function loadTransaction(txid, done ){
    $.get('/api/tx/'+txid, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderTransactionHtml(txid,respond.message,done);
        }
    });
}

function renderTransactionHtml(txid,data, done) {
    getTemplate('/templates/tx/body.template', function(template) {
        data.TXID = txid;
        data.PAGE_TITLE = 'Transaction';
        data.amountNQTStr = satoshiToFloat(data.amountNQT);
        data.amountNQTStrUnit = floatToUnitStr(data.amountNQTStr);
        data.feeNQTStr = satoshiToFloat(data.feeNQT);
        data.unixTimestamp = parseInt(data.timestamp)*1000 + parseInt(data.genesisTimestamp);
        data.timeString = moment(data.unixTimestamp).format("ddd, MMM Do YYYY, HH:mm:ss");
        data.timeStringDelta = moment(data.unixTimestamp).fromNow();
        console.log(data);
        done(Mustache.render(template, data));
    });
}

function initPageTransaction() {

}