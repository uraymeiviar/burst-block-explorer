function loadAccount(accid, done ){
    $.get('/api/acc/'+accid, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderAccountHtml(accid,respond.message,done);
        }
    });
}

function preprocessAccData(data){
    data.ACCID = data.account;
    data.PAGE_TITLE = 'Account';
    data.balanceNQTStr = satoshiToFloat(data.balanceNQT);
    data.balanceNQTStrUnit = floatToUnitStr(parseFloat(data.balanceNQTStr));
    data.unconfirmedBalanceNQTStr = satoshiToFloat(data.unconfirmedBalanceNQT);
    data.forgedBalanceNQTStr = satoshiToFloat(data.forgedBalanceNQT);
}

function renderAccountHtml(accid,data, done) {
    getTemplate('/templates/account.template', function(template) {
        preprocessAccData(data);
        console.log(data);
        done(Mustache.render(template, data));
        var qrArea = $('#AccountQR-'+accid);
        qrArea.qrcode({
            "size": parseInt(qrArea.innerHeight()),
            "fill": "#30DA7B",
            "render": "div",
            "text": data.accountRS
        });
    });
}

function initPageAccount() {

}