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
    $('.MainMenu').removeClass('MainMenuActive');
    $('#MainMenuStat').addClass('MainMenuActive');
    getTemplate('/templates/stat.template', function(template) {
        preprocessStatData(data);
        done(Mustache.render(template, data));

        var blockGenChartdata = {
            labels: [
                "< 1 sec ",
                "1 .. 180 secs ",
                "180 .. 360 secs ",
                "360 .. 540 secs ",
                "540 .. 720 secs ",
                "720 .. 900 secs ",
                "900 .. 1080 secs ",
                "1080 .. 1260 secs ",
                "1260 .. 1440 secs ",
                "1440 .. 1620 secs ",
                "1620 .. 1800 secs ",
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
            responsive: true,
            maintainAspectRatio: false,
            tooltipFillColor: "rgba(64,64,64,0.6)",
            tooltipFontSize: 12
        };

        var canvasElement = $("#blockGenChart");
        var blockGenChartCtx = canvasElement.get(0).getContext("2d");
        //canvasElement.width(canvasElement.parent().width()+'px');
        //canvasElement.height(canvasElement.parent().height()+'px');
        blockGenChartCtx.canvas.width = canvasElement.parent().width();
        blockGenChartCtx.canvas.height = canvasElement.parent().height();
        var blockGenChart = new Chart(blockGenChartCtx).Bar(blockGenChartdata, blockGenChartOpt);

        var txAmountChartData = {
            labels: [
                "< 1 ",
                "1 .. 10 ",
                "10 .. 100 ",
                "100 .. 1K ",
                "1K .. 10K ",
                "10K .. 100K ",
                "100K .. 1M ",
                "1M .. 10M ",
                "> 10M "
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
        //txCanvasElement.width(txCanvasElement.parent().width()+'px');
        //txCanvasElement.height(txCanvasElement.parent().height()+'px');
        txAmountChartCtx.canvas.width = txCanvasElement.parent().width();
        txAmountChartCtx.canvas.height = txCanvasElement.parent().height();
        var txAmountChart = new Chart(txAmountChartCtx).Bar(txAmountChartData, blockGenChartOpt);

        var accBalanceChartData = {
            labels: [
                "< 1 ",
                "1 ..10 ",
                "10 .. 100 ",
                "100 .. 1K ",
                "1K .. 10K ",
                "10K ..100K ",
                "100K ..1M ",
                "1M ..10M ",
                "10M ..100M ",
                "> 100M "
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
        accCanvasElement.width(accCanvasElement.parent().width()+'px');
        accCanvasElement.height(accCanvasElement.parent().height()+'px');
        accDistCtx.canvas.width = accCanvasElement.parent().width();
        accDistCtx.canvas.height = accCanvasElement.parent().height();
        var accDistChart = new Chart(accDistCtx).Bar(accBalanceChartData, blockGenChartOpt);

        var lineChartOption = {
            showScale: false,
            scaleBeginAtZero : false,
            scaleShowGridLines : false,
            scaleGridLineColor : "rgba(0,0,0,.05)",
            scaleGridLineWidth : 1,
            barShowStroke : false,
            barStrokeWidth : 0,
            barValueSpacing : 3,
            barDatasetSpacing : 1,
            pointHitDetectionRadius : 0.5,
            datasetFill : false,
            pointDot : false,
            pointDotRadius : 1,
            responsive: true,
            bezierCurve : false,
            maintainAspectRatio: false,
            tooltipFillColor: "rgba(64,64,64,0.6)",
            tooltipFontSize: 12
        };

        var blockDiffChartData = {
            labels: [],
            datasets: [
                {
                    label: "Block Difficulty",
                    fillColor: "#5b7997",
                    strokeColor: "#80a2c5",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.hourly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.hourly[i].timestamp)*1000 + parseInt(data.blocks.hourly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            blockDiffChartData.labels.push(timestampStr);
            var diffStr = parseFloat(data.blocks.hourly[i].diff).toFixed(2);
            blockDiffChartData.datasets[0].data.push(diffStr);
        }

        var blockDiffCanvasElement = $("#blockDiffChart");
        var blockDiffCtx = blockDiffCanvasElement.get(0).getContext("2d");
        blockDiffCanvasElement.width(blockDiffCanvasElement.parent().width()+'px');
        blockDiffCanvasElement.height(blockDiffCanvasElement.parent().height()+'px');
        blockDiffCtx.canvas.width = blockDiffCanvasElement.parent().width();
        blockDiffCtx.canvas.height = blockDiffCanvasElement.parent().height();
        var blockDiffChart = new Chart(blockDiffCtx).Line(blockDiffChartData, lineChartOption);

        var txChartData = {
            labels: [],
            datasets: [
                {
                    label: "Transaction Amount",
                    fillColor: "#8D5A5A",
                    strokeColor: "#8D5A5A",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.hourly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.hourly[i].timestamp)*1000 + parseInt(data.blocks.hourly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            txChartData.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.hourly[i].txAmount/(1000*data.blocks.hourly[i].accCount)).toFixed(2);
            txChartData.datasets[0].data.push(amountStr);
        }

        var txChartCanvasElement = $("#txChart");
        var txChartCtx = txChartCanvasElement.get(0).getContext("2d");
        txChartCanvasElement.width(txChartCanvasElement.parent().width()+'px');
        txChartCanvasElement.height(txChartCanvasElement.parent().height()+'px');
        txChartCtx.canvas.width = txChartCanvasElement.parent().width();
        txChartCtx.canvas.height = txChartCanvasElement.parent().height();
        var txChart = new Chart(txChartCtx).Line(txChartData, lineChartOption);

        var fundChartData = {
            labels: [],
            datasets: [
                {
                    label: "Transaction Amount",
                    fillColor: "#52b173",
                    strokeColor: "#52b173",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.hourly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.hourly[i].timestamp)*1000 + parseInt(data.blocks.hourly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            fundChartData.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.hourly[i].fundDist).toFixed(2);
            fundChartData.datasets[0].data.push(amountStr);
        }

        var fundChartCanvasElement = $("#fundChart");
        var fundChartCtx = fundChartCanvasElement.get(0).getContext("2d");
        fundChartCanvasElement.width(fundChartCanvasElement.parent().width()+'px');
        fundChartCanvasElement.height(fundChartCanvasElement.parent().height()+'px');
        fundChartCtx.canvas.width = fundChartCanvasElement.parent().width();
        fundChartCtx.canvas.height = fundChartCanvasElement.parent().height();
        var fundChart = new Chart(fundChartCtx).Line(fundChartData, lineChartOption);
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