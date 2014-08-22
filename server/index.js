var express = require('express');
var router = express.Router();
var fs = require('fs');
var jsonFormat      = require('prettyjson');
var pageCache = fs.readFileSync('client/index.html');

router.get('/', function(req, res) {
    try{
        res.type('html');
        res.send(pageCache);
    }
    catch(ex){
        console.log(jsonFormat.render(ex));
    }
});

module.exports = router;
