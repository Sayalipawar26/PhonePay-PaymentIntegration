const axios = require('axios');
const sha256 = require('sha256');
const uniqid = require('uniqid');

const MERCHANT_ID = 'PGTESTPAYUAT';
const PHONE_PE_HOST_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const SALT_INDEX = 1;
const SALT_KEY = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
const APP_BE_URL = 'http://localhost:3000';

exports.initiatePayment = async (req, res) => {
  try {
    const amount = +req.query.amount;
    const userId = 'MUID123';
    const merchantTransactionId = uniqid();

    const normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100,
      redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
      redirectMode: 'REDIRECT',
      mobileNumber: '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const bufferObj = Buffer.from(JSON.stringify(normalPayLoad), 'utf8');
    const base64EncodedPayload = bufferObj.toString('base64');

    const string = base64EncodedPayload + '/pg/v1/pay' + SALT_KEY;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + '###' + SALT_INDEX;

    const response = await axios.post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
      { request: base64EncodedPayload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyChecksum,
          accept: 'application/json',
        },
      }
    );

    res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.validatePayment = async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    if (!merchantTransactionId) {
      throw new Error('Merchant transaction ID is missing');
    }

    const statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;
    const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
    const sha256_val = sha256(string);
    const xVerifyChecksum = sha256_val + '###' + SALT_INDEX;

    const response = await axios.get(statusUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerifyChecksum,
        'X-MERCHANT-ID': merchantTransactionId,
        accept: 'application/json',
      },
    });

    if (response.data && response.data.code === 'PAYMENT_SUCCESS') {
      res.send(response.data);
    } else {
      // Redirect to payment failure / pending status page
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};
