#!/usr/bin/env node
var express         = require('express');
var path            = require('path');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var request         = require('request');
var jsonFormat      = require('prettyjson');
var compression     = require('compression');
var fs              = require('fs');

var account         = require('./server/account');
var transaction     = require('./server/transaction');
var block           = require('./server/block');
var index           = require('./server/index');
var recentInfo      = require('./server/recentInfo');
var burst           = require('./server/burstapi');
var burstStat       = require('./server/burststat');
var stat            = require('./server/stat');
BurstConfig         = require('./burst-config');

var app = express();

app.use(compression({
    threshold: 64
}))
app.use(logger('dev'));
app.use(cookieParser());

app.use('/api/acc', account);
app.use('/api/tx', transaction);
app.use('/api/blk', block);
app.use('/api/recent',recentInfo);
app.use('/api/stat',stat);
app.use(express.static(path.join(__dirname, 'client')));
app.use('/',index);
app.use('/stat',index);
app.use('/acc/*',index);
app.use('/tx/*',index);
app.use('/blk/*',index);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.send('404 Not Found');
});

domain = require('domain'),
    d = domain.create();

d.on('error', function(err) {
    console.error(err);
});


app.set('port', process.env.PORT || BurstConfig.httpPort);

//check wallet availability
request.post( {
        url:BurstConfig.walletUrl,
        form: { requestType:'getConstants' }
    },
    function(error, res, body){
        if (!error && res.statusCode == 200) {
            BurstConfig.walletConstant = JSON.parse(body);

            request.post( {
                    url:BurstConfig.walletUrl,
                    form: { requestType:'getTime' }
                },
                function(error2, res2, body2){
                    var currentTime = new Date().getTime();
                    var blockTimestamp = JSON.parse(body2);
                    BurstConfig.genesisBlockTimestamp = currentTime - parseInt(blockTimestamp.time)*1000;
                    console.log("genesis-block blocktime "+blockTimestamp.time);

                    app.listen(app.get('port'), function() {
                        console.log('HTTP server listening on port ' + app.get('port'));
                    });

                    console.log('current timestamp '+currentTime);
                    console.log("genesis-block timestamp "+BurstConfig.genesisBlockTimestamp);
                    BurstConfig.walletConstant.genesisBlockTimestamp = BurstConfig.genesisBlockTimestamp;
                    burst.getClientState().constant = BurstConfig.walletConstant;

                    setInterval(function(){burst.update(burst)},1000);

                    var statFile = path.join(__dirname, 'client')+'/stat.json';
                    burstStat.init(statFile);
                    burstStat.sync(function(){
                        burst.getClientState().onNewBlock = function(){
                            burstStat.sync(function(){});
                        }
                    });
                }
            );
        }
    }
);
