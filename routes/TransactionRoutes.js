const express = require('express');
const transactionController = require('../controllers/TransactionController');
const Router = express.Router();

Router.post('/transactions', transactionController.createTransaction);
Router.get('/transactions', transactionController.getTransactions);

Router.get('/transactions/get-overall-stats', transactionController.getOverAllStats);
Router.get('/transactions/popularity', transactionController.getPopularity);
Router.get('/transactions/prev-comp', transactionController.prevComparison);
Router.get('/transactions/yearly', transactionController.getYearlyData)

module.exports = Router;