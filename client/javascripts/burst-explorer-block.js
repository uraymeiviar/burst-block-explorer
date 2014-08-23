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

    if(data.hasOwnProperty('previousBlockData')){
        data.roundTimeNum = data.timestamp - data.previousBlockData.timestamp;
        var roundElapsed = moment.duration(data.roundTimeNum*1000);
        data.roundTime = roundElapsed.humanize()+' ('+data.roundTimeNum+'s)';
        data.diffIncrease = floatToUnitStr(data.baseTarget - data.previousBlockData.baseTarget);
    }

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
    getTemplate('/templates/block.template', function(template) {
        preprocessBlkData(data);
        for(var i=0 ; i<data.relatedAccounts.length ; i++){
            preprocessAccData(data.relatedAccounts[i]);
        }
        for(var i=0 ; i<data.transactionsData.length ; i++){
            preprocessTxData(data.transactionsData[i]);
        }
        done(Mustache.render(template, data));

        for(var i=0 ; i<data.relatedAccounts.length ; i++){
            var qrArea = $('#AccountQR-'+data.relatedAccounts[i].account);
            qrArea.qrcode({
                "size": parseInt(qrArea.innerHeight()),
                "fill": "#30DA7B",
                "render": "div",
                "text": data.relatedAccounts[i].accountRS
            });
        }
    });
}

function initPageBlock() {
    var root = $('body');

    root.on('click','.BlockContentBtn',function(event){
        var id = event.target.id;
        var blkid = id.split('-')[1];
        $('#BlockDetailInfo-'+blkid).toggle();
        $('#BlockDetailTx-'+blkid).toggle();
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

