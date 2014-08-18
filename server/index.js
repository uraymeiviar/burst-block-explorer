var express = require('express');
var router = express.Router();
var fs = require('fs');
var pageCache = fs.readFileSync('client/index.html');

router.get('/', function(req, res) {
    res.type('html');
    res.send(pageCache);
});

module.exports = router;
