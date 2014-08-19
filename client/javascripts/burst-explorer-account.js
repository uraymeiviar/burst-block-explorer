function loadAccount(accid, done ){
    $.get('/api/acc/'+accid, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderAccountHtml(accid,respond.message,done);
        }
    });
}

function renderAccountHtml(accid,data, done) {
    getTemplate('/templates/acc/body.template', function(template) {
        data.ACCID = accid;
        data.PAGE_TITLE = 'Account';
        data.balanceNQTStr = satoshiToFloat(data.balanceNQT);
        data.unconfirmedBalanceNQTStr = satoshiToFloat(data.unconfirmedBalanceNQT);
        data.forgedBalanceNQTStr = satoshiToFloat(data.forgedBalanceNQT);
        done(Mustache.render(template, data));
        console.log(data);
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