function loadStat( done ){
    $.get('/api/stat/', function(res) {
        renderStatHtml(res,done);
    });
}

function preprocessStatData(data){
    for(var i=0 ; i<data.blkHighestDiff.length ; i++){
        data.blkHighestDiff[i].diffStr = parseFloat(data.blkHighestDiff[i].diff).toFixed(2);
    }
    for(var i=0 ; i<data.blkSlowest.length ; i++){
        var duration = moment.duration(parseInt(data.blkSlowest[i].roundTime),"seconds");
        data.blkSlowest[i].roundTimeStr = duration.humanize()+' ( '+parseInt(data.blkSlowest[i].roundTime)+' secs )';
    }
    for(var i=0 ; i<data.txTopAmount.length ; i++){
        var amountStr = floatToUnitStr(parseFloat(data.txTopAmount[i].amount));
        data.txTopAmount[i].amountStr = amountStr;
    }
    for(var i=0 ; i<data.accMostRich.length ; i++){
        var balanceStr = floatToUnitStr(parseFloat(data.accMostRich[i].balance));
        data.accMostRich[i].balanceStr = balanceStr;
    }
    for(var i=0 ; i<data.accTopMiners.length ; i++){
        var minedStr = floatToUnitStr(parseFloat(data.accTopMiners[i].mined));
        data.accTopMiners[i].minedStr = minedStr;
    }
    for(var i=0 ; i<data.accTopTxAmount.length ; i++){
        var txAmountStr = floatToUnitStr(parseFloat(data.accTopTxAmount[i].txAmount));
        data.accTopTxAmount[i].txAmountStr = txAmountStr;
    }
    for(var i=0 ; i<data.accMostActive.length ; i++){
        var txCountStr = floatToUnitStr(parseFloat(data.accMostActive[i].txCount));
        data.accMostActive[i].txCountStr = txCountStr;
    }
}

function renderStatHtml(data,done) {
    getTemplate('/templates/stat.template', function(template) {
        preprocessStatData(data);
        done(Mustache.render(template, data));

        var blockGenChartdata = {
            labels: [
                "< 1 sec",
                "1..180 secs",
                "180..360 secs",
                "360..540 secs",
                "540..720 secs",
                "720..900 secs",
                "900..1080 secs",
                "1080..1260 secs",
                "1260..1440 secs",
                "1440..1620 secs",
                "1620..1800 secs",
                "> 1800 secs"
            ],
            datasets: [
                {
                    label: "Block Generation Time Distribution",
                    fillColor: "#5b7997",
                    strokeColor: "#80a2c5",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    data: data.distBlkGenTime
                }
            ]
        };

        var blockGenChartOpt = {
            showScale: false,
            scaleBeginAtZero : true,
            scaleShowGridLines : false,
            scaleGridLineColor : "rgba(0,0,0,.05)",
            scaleGridLineWidth : 1,
            barShowStroke : false,
            barStrokeWidth : 0,
            barValueSpacing : 3,
            barDatasetSpacing : 1,
            responsive: true
        };

        var canvasElement = $("#blockGenChart");
        var blockGenChartCtx = canvasElement.get(0).getContext("2d");
        canvasElement.width(canvasElement.parent().innerWidth()+'px');
        canvasElement.height(canvasElement.parent().innerHeight()+'px');
        blockGenChartCtx.canvas.width = canvasElement.parent().innerWidth();
        blockGenChartCtx.canvas.height = canvasElement.parent().innerHeight();
        var blockGenChart = new Chart(blockGenChartCtx).Bar(blockGenChartdata, blockGenChartOpt);

        var txAmountChartData = {
            labels: [
                "< 1",
                "1..10",
                "18..100",
                "100..1K",
                "1K..10K",
                "10K..100K",
                "100K..1M",
                "1M..10M",
                "> 10M"
            ],
            datasets: [
                {
                    label: "Transaction Amount Distribution",
                    fillColor: "#8D5A5A",
                    strokeColor: "#8D5A5A",
                    highlightFill: "#291B1B",
                    highlightStroke: "#291B1B",
                    data: data.distTxAmount
                }
            ]
        };

        var txCanvasElement = $("#txAmountChart");
        var txAmountChartCtx = txCanvasElement.get(0).getContext("2d");
        txCanvasElement.width(txCanvasElement.parent().innerWidth()+'px');
        txCanvasElement.height(txCanvasElement.parent().innerHeight()+'px');
        txAmountChartCtx.canvas.width = txCanvasElement.parent().innerWidth();
        txAmountChartCtx.canvas.height = txCanvasElement.parent().innerHeight();
        var txAmountChart = new Chart(txAmountChartCtx).Bar(txAmountChartData, blockGenChartOpt);

        var accBalanceChartData = {
            labels: [
                "< 1",
                "1..10",
                "18..100",
                "100..1K",
                "1K..10K",
                "10K..100K",
                "100K..1M",
                "1M..10M",
                "10M..100M",
                "> 100M"
            ],
            datasets: [
                {
                    label: "Transaction Amount Distribution",
                    fillColor: "#52b173",
                    strokeColor: "#52b173",
                    highlightFill: "#1A2522",
                    highlightStroke: "#1A2522",
                    data: data.distAccBalance
                }
            ]
        };

        var accCanvasElement = $("#accDistChart");
        var accDistCtx = accCanvasElement.get(0).getContext("2d");
        accCanvasElement.width(accCanvasElement.parent().innerWidth()+'px');
        accCanvasElement.height(accCanvasElement.parent().innerHeight()+'px');
        accDistCtx.canvas.width = accCanvasElement.parent().innerWidth();
        accDistCtx.canvas.height = accCanvasElement.parent().innerHeight();
        var accDistChart = new Chart(accDistCtx).Bar(accBalanceChartData, blockGenChartOpt);
    });
}

function initPageStat() {
    var root = $('body');

    root.on('click','.BlockStatCatSelector',function(event){
        var id = event.target.id;
        var statId = id.split('-')[1];

        $('.BlockStatCatSelector').removeClass('BlockStatCatSelectorActive');
        $('#'+id).addClass('BlockStatCatSelectorActive');

        $('.BlockStatList').hide();
        $('#BlockStatList-'+statId).show();
    });

    root.on('click','.AccStatCatSelector',function(event){
        var id = event.target.id;
        var statId = id.split('-')[1];

        $('.AccStatCatSelector').removeClass('AccStatCatSelectorActive');
        $('#'+id).addClass('AccStatCatSelectorActive');

        $('.AccStatList').hide();
        $('#AccStatList-'+statId).show();
    });
}