const express = require('express');
const expiredController = require('../controllers/ExpiredController');

const Router = express.Router();

Router.get('/expired' , expiredController.getExpiredItems);

module.exports = Router