var express = require('express');
var router = express.Router();
var jsonFormat      = require('prettyjson');
var burstStat       = require('./burststat');

router.get('/', function(req, res) {
    try{
        res.setHeader('Content-Type', 'application/json');
        res.send(burstStat.getStatJsonStr());
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
