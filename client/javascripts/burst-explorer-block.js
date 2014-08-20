function loadBlock(blkid, done ){
    $.get('/api/blk/'+blkid, function(res) {
        var respond = JSON.parse(res);
        if(respond.status === true){
            renderBlockHtml(blkid,respond.message,done);
        }
    });
}

function preprocessBlkData(data){
    data.BLKID = data.blockId;
    data.PAGE_TITLE = 'Block';
    data.totalFeeNQT = (parseFloat(data.totalFeeNQT)/100000000.0).toFixed(2);
    data.unixTimestamp = parseInt(data.timestamp)*1000 + parseInt(data.genesisTimestamp);
    data.timeString = moment(data.unixTimestamp).format("ddd, MMM Do YYYY, HH:mm:ss");
    data.timeStringDelta = moment(data.unixTimestamp).fromNow();
    data.totalAmountNQTStr = satoshiToFloat(data.totalAmountNQT);
    data.totalAmountNQTStrUnit = floatToUnitStr(parseFloat(data.totalAmountNQTStr));
    data.blockRewardStrUnit = floatToUnitStr(data.blockReward);

    var diff = data.baseTarget;
    if( diff > 999999999999) {
        diff = diff / 1000000000000;
        data.baseTargetStr = diff.toFixed(2);
        data.baseTargetUnit = 'T';
    }
    else if( diff > 999999999 ){
        diff = diff / 1000000000;
        data.baseTargetStr = diff.toFixed(2);
        data.baseTargetUnit = 'G';
    }
    else if( diff > 999999 ){
        diff = diff / 1000000;
        data.baseTargetStr = diff.toFixed(2);
        data.baseTargetUnit = 'M';
    }
    else {
        diff = diff / 1000;
        data.baseTargetStr = diff.toFixed(2);
        data.baseTargetUnit = 'K';
    }
}

function renderBlockHtml(blkid,data,done) {
    getTemplate('/templates/blk/body.template', function(template) {
        preprocessBlkData(data);
        done(Mustache.render(template, data));
    });
}

function initPageBlock() {
    var root = $('body');

    root.on('click','.BlockContentBtn',function(event){
        var id = event.target.id;
        var blkid = id.split('-')[1];
        $('#BlockDetailInfo-'+blkid).toggle();
        /*
        if($('#BlockDetailInfo-'+blkid).toggle().is(':visible')){
            $('#BlockDetailInfo-'+blkid).removeClass('Hidden');
            console.log('show');
        }
        else {
            $('#BlockDetailInfo-'+blkid).addClass('Hidden');
            console.log('hidden');
        }*/
    });
    /*
    root.on('click','.ToggleBtnBlockDetailTx',function(event){
        var id = event.target.id;
        var blkid = id.split('-')[1];
        var visible = $('#BlockDetailTx-'+blkid).toggle().is(":visible");
        if(visible){
            $('#ToggleBtnBlockDetailTx-'+blkid).addClass('BlockInfoBtnActive');
        }
        else {
            $('#ToggleBtnBlockDetailTx-'+blkid).removeClass('BlockInfoBtnActive');
        }
    });


    root.on('click','.PrevBlockBtn', function(event){
        var id = event.target.id;
        var blkid = id.split('-')[1];
        var prevBlkId = $('#PrevBlockOf-'+blkid).html();
        loadBlock(prevBlkId, function(html){
            $(html).insertBefore('#Block-'+blkid);
        });
        event.preventDefault();
        event.stopPropagation();
    });

    root.on('click','.NextBlockBtn', function(event){
        var id = event.target.id;
        var blkid = id.split('-')[1];
        var nextBlkId = $('#NextBlockOf-'+blkid).html();
        loadBlock(nextBlkId, function(html){
            $(html).insertBefore('#Block-'+blkid);
        });
        event.preventDefault();
        event.stopPropagation();
    });
    */
}

