function renderHtml(txid,data) {
    $.get('/templates/tx/body.template', function(template) {
        data.TXID = txid;
        data.PAGE_TITLE = 'Transaction';
        var html = Mustache.to_html(template, data);
        $('#htmlbody').html(html);
    });
}
function onModuleLoaded(paths) {
    $.get('/api/tx/'+paths[2], function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderHtml(paths[2],respond.message);
        }
    });
}