var blockDiffChart;
var blockDiffChartDaily;
var blockDiffChartWeekly;
var txChart;
var txChartDaily;
var txChartWeekly;
var fundChart;
var fundChartDaily;
var fundChartWeekly;

function loadStat( done ){
    $.get('/api/stat/', function(res) {
        renderStatHtml(res,done);
    });
}

function preprocessStatData(data){
    var hourlyStart = parseInt(data.blocks.hourly[data.blocks.hourly.length-1].timestamp)*1000 + parseInt(data.genesisTimestamp);
    data.hourlyStartTimeStr = moment(hourlyStart).format('MMM Do hh:mm:ss');

    var hourlyEnd = parseInt(data.blocks.hourly[0].timestamp)*1000 + parseInt(data.blocks.hourly[0].timeLength)*1000 + parseInt(data.genesisTimestamp);
    data.hourlyEndTimeStr = moment(hourlyEnd).format('MMM Do hh:mm:ss');

    var dailyStart = parseInt(data.blocks.daily[data.blocks.daily.length-1].timestamp)*1000 + parseInt(data.genesisTimestamp);
    data.dailyStartTimeStr = moment(dailyStart).format('MMM Do hh:mm:ss');

    var dailyEnd = parseInt(data.blocks.daily[0].timestamp)*1000 + parseInt(data.blocks.daily[0].timeLength)*1000 + parseInt(data.genesisTimestamp);
    data.dailyEndTimeStr = moment(dailyEnd).format('MMM Do hh:mm:ss');

    var weeklyStart = parseInt(data.blocks.weekly[data.blocks.weekly.length-1].timestamp)*1000 + parseInt(data.genesisTimestamp);
    data.weeklyStartTimeStr = moment(weeklyStart).format('MMM Do hh:mm:ss');

    var weeklyEnd = parseInt(data.blocks.weekly[0].timestamp)*1000 + parseInt(data.blocks.weekly[0].timeLength)*1000 + parseInt(data.genesisTimestamp);
    data.weeklyEndTimeStr = moment(weeklyEnd).format('MMM Do hh:mm:ss');

    for(var i=0 ; i<data.blkHighestDiff.length ; i++){
        data.blkHighestDiff[i].diffStr = parseFloat(data.blkHighestDiff[i].diff).toFixed(2);
        data.blkHighestDiff[i].rank = i+1;
    }
    for(var i=0 ; i<data.blkSlowest.length ; i++){
        var duration = moment.duration(parseInt(data.blkSlowest[i].roundTime),"seconds");
        data.blkSlowest[i].roundTimeStr = duration.humanize()+' ( '+parseInt(data.blkSlowest[i].roundTime)+' secs )';
        data.blkSlowest[i].rank = i+1;
    }
    for(var i=0 ; i<data.txTopAmount.length ; i++){
        var amountStr = floatToUnitStr(parseFloat(data.txTopAmount[i].amount));
        data.txTopAmount[i].amountStr = amountStr;
        data.txTopAmount[i].rank = i+1;
        data.txTopAmount[i].usd = parseFloat(parseFloat(data.txTopAmount[i].amount)*parseFloat(data.burstPrice.last)*parseFloat(data.btcPrice.last)).toFixed(1);
        data.txTopAmount[i].btc = parseFloat(parseFloat(data.txTopAmount[i].amount)*parseFloat(data.burstPrice.last)).toFixed(8);
    }
    for(var i=0 ; i<data.accMostRich.length ; i++){
        var balanceStr = floatToUnitStr(parseFloat(data.accMostRich[i].balance));
        data.accMostRich[i].balanceStr = balanceStr;
        data.accMostRich[i].rank = i+1;
        data.accMostRich[i].usd = parseFloat(parseFloat(data.accMostRich[i].balance)*parseFloat(data.burstPrice.last)*parseFloat(data.btcPrice.last)).toFixed(1);
        data.accMostRich[i].btc = parseFloat(parseFloat(data.accMostRich[i].balance)*parseFloat(data.burstPrice.last)).toFixed(8);
    }
    for(var i=0 ; i<data.accTopMiners.length ; i++){
        var minedStr = floatToUnitStr(parseFloat(data.accTopMiners[i].mined));
        data.accTopMiners[i].minedStr = minedStr;
        data.accTopMiners[i].rank = i+1;
        data.accTopMiners[i].usd = parseFloat(parseFloat(data.accTopMiners[i].mined)*parseFloat(data.burstPrice.last)*parseFloat(data.btcPrice.last)).toFixed(1);
        data.accTopMiners[i].btc = parseFloat(parseFloat(data.accTopMiners[i].mined)*parseFloat(data.burstPrice.last)).toFixed(8);
    }
    for(var i=0 ; i<data.accTopTxAmount.length ; i++){
        var txAmountStr = floatToUnitStr(parseFloat(data.accTopTxAmount[i].txAmount));
        data.accTopTxAmount[i].txAmountStr = txAmountStr;
        data.accTopTxAmount[i].rank = i+1;
        data.accTopTxAmount[i].usd = parseFloat(parseFloat(data.accTopTxAmount[i].txAmount)*parseFloat(data.burstPrice.last)*parseFloat(data.btcPrice.last)).toFixed(1);
        data.accTopTxAmount[i].btc = parseFloat(parseFloat(data.accTopTxAmount[i].txAmount)*parseFloat(data.burstPrice.last)).toFixed(8);
    }
    for(var i=0 ; i<data.accMostActive.length ; i++){
        var txCountStr = floatToUnitStr(parseFloat(data.accMostActive[i].txCount));
        data.accMostActive[i].txCountStr = txCountStr;
        data.accMostActive[i].rank = i+1;
    }

    data.totalTxAmountStr = floatToUnitStr(parseFloat(data.totalTransactionAmount));
    data.totalCirculationStr = floatToUnitStr(parseFloat(data.totalCirculation));
    data.marketCap = parseFloat(parseFloat(data.totalCirculation)*parseFloat(data.burstPrice.last)*parseFloat(data.btcPrice.last)).toFixed(1);
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
        resizeCanvas(canvasElement);
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
        resizeCanvas(txCanvasElement);
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
        resizeCanvas(accCanvasElement);
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
                    strokeColor: "#5b7997",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#5b7997",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Miner Count",
                    fillColor: "#3c5169",
                    strokeColor: "#3c5169",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#3c5169",
                    pointHighlightFill: "#19222e",
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
            var minerCnt = parseInt(data.blocks.hourly[i].minerCount);
            blockDiffChartData.datasets[1].data.push(minerCnt);
        }

        var blockDiffCanvasElement = $("#blockDiffChart");
        var blockDiffCtx = blockDiffCanvasElement.get(0).getContext("2d");
        resizeCanvas(blockDiffCanvasElement);
        blockDiffChart = new Chart(blockDiffCtx).Line(blockDiffChartData, lineChartOption);

        var lineChartOptionAlt = {
            showScale: false,
            scaleBeginAtZero : false,
            scaleShowGridLines : false,
            scaleGridLineColor : "rgba(0,0,0,.05)",
            scaleGridLineWidth : 1,
            barShowStroke : false,
            barStrokeWidth : 0,
            barValueSpacing : 3,
            barDatasetSpacing : 1,
            pointHitDetectionRadius : 3,
            datasetFill : false,
            pointDot : true,
            pointDotRadius : 3,
            responsive: true,
            bezierCurve : true,
            maintainAspectRatio: false,
            tooltipFillColor: "rgba(64,64,64,0.6)",
            tooltipFontSize: 12
        };

        var blockDiffChartDataDaily = {
            labels: [],
            datasets: [
                {
                    label: "Block Difficulty",
                    fillColor: "#5b7997",
                    strokeColor: "#5b7997",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#5b7997",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Miner Count",
                    fillColor: "#3c5169",
                    strokeColor: "#3c5169",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#3c5169",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.daily.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.daily[i].timestamp)*1000 + parseInt(data.blocks.daily[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            blockDiffChartDataDaily.labels.push(timestampStr);
            var diffStr = parseFloat(data.blocks.daily[i].diff).toFixed(2);
            blockDiffChartDataDaily.datasets[0].data.push(diffStr);
            var minerCnt = parseInt(data.blocks.daily[i].minerCount);
            blockDiffChartDataDaily.datasets[1].data.push(minerCnt);
        }

        var blockDiffCanvasElementDaily = $("#blockDiffChartDaily");
        var blockDiffCtxDaily = blockDiffCanvasElementDaily.get(0).getContext("2d");
        resizeCanvas(blockDiffCanvasElementDaily);
        blockDiffChartDaily = new Chart(blockDiffCtxDaily).Line(blockDiffChartDataDaily, lineChartOptionAlt);

        var blockDiffChartDataWeekly = {
            labels: [],
            datasets: [
                {
                    label: "Block Difficulty",
                    fillColor: "#5b7997",
                    strokeColor: "#5b7997",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#5b7997",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Miner Count",
                    fillColor: "#3c5169",
                    strokeColor: "#3c5169",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#3c5169",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.weekly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.weekly[i].timestamp)*1000 + parseInt(data.blocks.daily[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            blockDiffChartDataWeekly.labels.push(timestampStr);
            var diffStr = parseFloat(data.blocks.weekly[i].diff).toFixed(2);
            blockDiffChartDataWeekly.datasets[0].data.push(diffStr);
            var minerCnt = parseInt(data.blocks.weekly[i].minerCount);
            blockDiffChartDataWeekly.datasets[1].data.push(minerCnt);
        }

        var blockDiffCanvasElementWeekly = $("#blockDiffChartWeekly");
        var blockDiffCtxWeekly = blockDiffCanvasElementWeekly.get(0).getContext("2d");
        resizeCanvas(blockDiffCanvasElementWeekly);
        blockDiffChartWeekly = new Chart(blockDiffCtxWeekly).Line(blockDiffChartDataWeekly, lineChartOptionAlt);


        var txChartData = {
            labels: [],
            datasets: [
                {
                    label: "Transaction Amount",
                    fillColor: "#8D5A5A",
                    strokeColor: "#8D5A5A",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#8D5A5A",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Transaction Count",
                    fillColor: "#F59B9B",
                    strokeColor: "#F59B9B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#F59B9B",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.hourly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.hourly[i].timestamp)*1000 + parseInt(data.blocks.hourly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            txChartData.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.hourly[i].txAmount/data.blocks.hourly[i].accCount).toFixed(2);
            var amountStr2 = parseFloat(data.blocks.hourly[i].tx).toFixed(2);
            txChartData.datasets[0].data.push(amountStr);
            txChartData.datasets[1].data.push(amountStr2);
        }

        var txChartCanvasElement = $("#txChart");
        var txChartCtx = txChartCanvasElement.get(0).getContext("2d");
        resizeCanvas(txChartCanvasElement);
        txChart = new Chart(txChartCtx).Line(txChartData, lineChartOption);

        var txChartDataDaily = {
            labels: [],
            datasets: [
                {
                    label: "Transaction Amount",
                    fillColor: "#8D5A5A",
                    strokeColor: "#8D5A5A",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#8D5A5A",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Transaction Count",
                    fillColor: "#F59B9B",
                    strokeColor: "#F59B9B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#F59B9B",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.daily.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.daily[i].timestamp)*1000 + parseInt(data.blocks.daily[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            txChartDataDaily.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.daily[i].txAmount/data.blocks.daily[i].accCount).toFixed(2);
            var amountStr2 = parseFloat(data.blocks.daily[i].tx).toFixed(2);
            txChartDataDaily.datasets[0].data.push(amountStr);
            txChartDataDaily.datasets[1].data.push(amountStr2);
        }

        var txChartCanvasElementDaily = $("#txChartDaily");
        var txChartCtxDaily = txChartCanvasElementDaily.get(0).getContext("2d");
        resizeCanvas(txChartCanvasElementDaily);
        txChartDaily = new Chart(txChartCtxDaily).Line(txChartDataDaily, lineChartOptionAlt);


        var txChartDataWeekly = {
            labels: [],
            datasets: [
                {
                    label: "Transaction Amount",
                    fillColor: "#8D5A5A",
                    strokeColor: "#8D5A5A",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#8D5A5A",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Transaction Count",
                    fillColor: "#F59B9B",
                    strokeColor: "#F59B9B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#F59B9B",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.weekly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.weekly[i].timestamp)*1000 + parseInt(data.blocks.weekly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            txChartDataWeekly.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.weekly[i].txAmount/data.blocks.weekly[i].accCount).toFixed(2);
            var amountStr2 = parseFloat(data.blocks.weekly[i].tx).toFixed(2);
            txChartDataWeekly.datasets[0].data.push(amountStr);
            txChartDataWeekly.datasets[1].data.push(amountStr2);
        }

        var txChartCanvasElementWeekly = $("#txChartWeekly");
        var txChartCtxWeekly = txChartCanvasElementWeekly.get(0).getContext("2d");
        resizeCanvas(txChartCanvasElementWeekly);
        txChartWeekly = new Chart(txChartCtxWeekly).Line(txChartDataWeekly, lineChartOptionAlt);

        var fundChartData = {
            labels: [],
            datasets: [
                {
                    label: "Fund Distribution",
                    fillColor: "#30DA7B",
                    strokeColor: "#30DA7B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#30DA7B",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Active Account",
                    fillColor: "#1A5522",
                    strokeColor: "#1A5522",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#1A5522",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.hourly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.hourly[i].timestamp)*1000 + parseInt(data.blocks.hourly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            fundChartData.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.hourly[i].fundDist/1000).toFixed(2);
            fundChartData.datasets[0].data.push(amountStr);
            var accCount = parseInt(data.blocks.hourly[i].accCount);
            fundChartData.datasets[1].data.push(accCount);
        }

        var fundChartCanvasElement = $("#fundChart");
        var fundChartCtx = fundChartCanvasElement.get(0).getContext("2d");
        resizeCanvas(fundChartCanvasElement);
        fundChart = new Chart(fundChartCtx).Line(fundChartData, lineChartOption);

        var fundChartDataDaily = {
            labels: [],
            datasets: [
                {
                    label: "Fund Distribution",
                    fillColor: "#30DA7B",
                    strokeColor: "#30DA7B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#30DA7B",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Active Account",
                    fillColor: "#1A5522",
                    strokeColor: "#1A5522",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#1A5522",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.daily.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.daily[i].timestamp)*1000 + parseInt(data.blocks.daily[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            fundChartDataDaily.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.daily[i].fundDist/1000).toFixed(2);
            fundChartDataDaily.datasets[0].data.push(amountStr);
            var accCount = parseInt(data.blocks.daily[i].accCount);
            fundChartDataDaily.datasets[1].data.push(accCount);
        }

        var fundChartCanvasElementDaily = $("#fundChartDaily");
        var fundChartCtxDaily = fundChartCanvasElementDaily.get(0).getContext("2d");
        resizeCanvas(fundChartCanvasElementDaily);
        fundChartDaily = new Chart(fundChartCtxDaily).Line(fundChartDataDaily, lineChartOptionAlt);

        var fundChartDataWeekly = {
            labels: [],
            datasets: [
                {
                    label: "Fund Distribution",
                    fillColor: "#30DA7B",
                    strokeColor: "#30DA7B",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#30DA7B",
                    pointHighlightFill: "#19222e",
                    data: []
                },
                {
                    label: "Active Account",
                    fillColor: "#1A5522",
                    strokeColor: "#1A5522",
                    highlightFill: "#19222e",
                    highlightStroke: "#19222e",
                    pointColor: "#1A5522",
                    pointHighlightFill: "#19222e",
                    data: []
                }
            ]
        };

        for(var i=data.blocks.weekly.length-1 ; i>=0 ; i--){
            var timestamp = parseInt(data.blocks.weekly[i].timestamp)*1000 + parseInt(data.blocks.weekly[i].timeLength)*1000 + parseInt(data.genesisTimestamp);
            var timestampStr = moment(timestamp).format('dddd, MMM Do, hh:mm:ss');
            fundChartDataWeekly.labels.push(timestampStr);
            var amountStr = parseFloat(data.blocks.weekly[i].fundDist/1000).toFixed(2);
            fundChartDataWeekly.datasets[0].data.push(amountStr);
            var accCount = parseInt(data.blocks.weekly[i].accCount);
            fundChartDataWeekly.datasets[1].data.push(accCount);
        }

        var fundChartCanvasElementWeekly = $("#fundChartWeekly");
        var fundChartCtxWeekly = fundChartCanvasElementWeekly.get(0).getContext("2d");
        resizeCanvas(fundChartCanvasElementWeekly);
        fundChartWeekly = new Chart(fundChartCtxWeekly).Line(fundChartDataWeekly, lineChartOptionAlt);

        $('#chartIntervalButton-Blk-Hourly').trigger('click');
        $('#chartIntervalButton-Tx-Hourly').trigger('click');
        $('#chartIntervalButton-Acc-Hourly').trigger('click');
    });
}

function resizeCanvas(element){
    var ctx = element.get(0).getContext("2d");
    element.width(element.parent().width()+'px');
    element.height(element.parent().height()+'px');
    ctx.canvas.width = element.parent().width();
    ctx.canvas.height = element.parent().height();
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

    root.on('click','.chartIntervalButton', function(event){
        var id = event.target.id;
        var chartType = id.split('-')[1];
        var chartInterval = id.split('-')[2];

        $('.chartIntervalButton-'+chartType).removeClass('chartIntervalButtonActive-'+chartType);
        $('#chartIntervalButton-'+chartType+'-'+chartInterval).addClass('chartIntervalButtonActive-'+chartType);

        $('.chartContainerInterval-'+chartType).hide();
        $('#chartContainerInterval-'+chartType+'-'+chartInterval).show();


        blockDiffChart.resize();
        blockDiffChartDaily.resize();
        blockDiffChartWeekly.resize();
        txChart.resize();
        txChartDaily.resize();
        txChartWeekly.resize();
        fundChartDaily.resize();
        fundChartWeekly.resize();
        fundChart.resize();

        blockDiffChart.update();
        blockDiffChartDaily.update();
        blockDiffChartWeekly.update();
        txChart.update();
        txChartDaily.update();
        txChartWeekly.update();
        fundChartDaily.update();
        fundChartWeekly.update();
        fundChart.update();
    });
}