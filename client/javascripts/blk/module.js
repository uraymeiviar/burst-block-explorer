function renderHtml(blkid,data) {
    $.get('/templates/blk/body.template', function(template) {
        data.BLKID = blkid;
        data.PAGE_TITLE = 'Block';
        var html = Mustache.to_html(template, data);
        $('#htmlbody').html(html);

        if(data.transactions.length > 0){
            $.get('/templates/blk/txitem.template', function(txTemplate) {
                var txHtml = '';
                for(var i=0 ; i<data.transactions.length ; i++) {
                    var txData = {
                        TXID : data.transactions[i]
                    };
                    txHtml += Mustache.to_html(txTemplate, txData);
                }
                $('#txList').html(txHtml);
            });
        }
    });
}

function onModuleLoaded(paths) {
    $.get('/api/blk/'+paths[2], function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderHtml(paths[2],respond.message);
        }
    });
}