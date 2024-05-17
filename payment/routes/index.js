const express = require("express");
const router = express.Router();

const { initiatePayment, validatePayment } = require('../controllers/index.js');


router.get('/pay', initiatePayment);
router.get('/payment/validate/:merchantTransactionId', validatePayment);


module.exports= router;

