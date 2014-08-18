function renderHtml(accid,data) {
    $.get('/templates/acc/body.template', function(template) {
        data.TXID = accid;
        data.PAGE_TITLE = 'Account';
        var html = Mustache.to_html(template, data);
        $('#htmlbody').html(html);
    });
}
function onModuleLoaded(paths) {
    var accStr = paths[2].replace(/(^\s+)|(\s+$)/g, '').toUpperCase();
    if(accStr.indexOf('BURST-') == 0) {
        var nxt = new NxtAddress();
        if(nxt.set(accStr)){
            accStr = nxt.account_id();
        }
    }
    console.log(accStr);
    $.get('/api/acc/'+accStr, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderHtml(accStr,respond.message);
        }
    });
}