var express = require('express');
var router = express.Router();

router.get('/:txid', function(req, res) {
    console.log('a');
  res.send(req.param['txid']);
});

module.exports = router;
