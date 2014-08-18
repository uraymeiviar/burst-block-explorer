var express = require('express');
var request = require('request');
var router = express.Router();

router.get('/:txid', function(clientReq, clientRes) {
    request.post(
        {
            url:BurstConfig.walletUrl,
            form: {
                requestType:'getTransaction',
                transaction:clientReq.params['txid']
            }
        },
        function(error, res, body){
            var respond = {
                status : true,
                message : null
            };
            if (!error && res.statusCode == 200) {
                respond.message = JSON.parse(body);
                var txType = respond.message.type;
                var txSubType = respond.message.subtype;
                respond.message.type = BurstConfig.walletConstant.transactionTypes[txType].description;
                respond.message.subtype = BurstConfig.walletConstant.transactionTypes[txType].subtypes[txSubType].description;
                respond.message.genesisTimestamp = BurstConfig.walletConstant;
            }
            else {
                respond.status  = false;
                respond.message = 'wallet error, '+res.statusCode;
            }
            clientRes.send(JSON.stringify(respond));
        }
    );
});

module.exports = router;
