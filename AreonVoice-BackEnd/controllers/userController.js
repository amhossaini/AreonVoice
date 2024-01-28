let uuid = require("uuid");
//var request = require('request');
let model = require('../models/index');
var fs = require('fs');
var Web3 = require('web3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");

module.exports = {
    getNonce: async function (req, res, next) {
        let user = await model.User.findOne({ where: { ethereumAddress: req.body.ethereumAddress } });
        var nonce = uuid.v4();
        if(user){
            user.nonce = nonce;
            user.save()
                .then(user => {
                    res.json({ hasError: false, data: {nonce: nonce}, message: 'user created successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
        }
        else{
            let data = req.body;
            data.nonce = nonce;
            model.User.create(data)
                .then(user => {
                    res.json({ hasError: false, data: {nonce: nonce}, message: 'user created successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
        }
    },
    loginWithPublicKey: async function (req, res, next) {
        let user = await model.User.findOne({ where: { ethereumAddress: req.body.ethereumAddress } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });
        var web3 = new Web3(Web3.givenProvider);
        let address = web3.eth.accounts.recover(user.nonce, req.body.signature);
        
        if (address.toString().toLowerCase() == user.ethereumAddress) {
            let token = jwt.sign({
                data: { ethereumAddress: user.ethereumAddress, id: user.id }
            }, '****************************************************', { expiresIn: '1d' });
            res.json({ hasError: false, data: { token: token, ethereumAddress: user.ethereumAddress, userId: user.id } });
        } else {
            res.json({ hasError: true, data: [], error: { message: 'Invalid signature' } })
        }
    },
    getTransactions: async function (req, res, next) {
        let user = await model.User.findOne({ where: { id: req.userId } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });
        var type = req.query.type;
        var page = req.query.page;
        var pageSize = req.query.pageSize;
        var offset = pageSize * page;
        var ethereumAddress = user.ethereumAddress;
        switch (type) {
            case '1'://inbox
                var count = await model.Transactions.count({where: { to : ethereumAddress }});
                model.Transactions.findAll({where: {to : ethereumAddress }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                    .then(data => {
                        res.json({ hasError: false, data: {owner: ethereumAddress, count : count, transactions : data}, message: 'Get transactions successfully' })
                    })
                    .catch(error => {
                        res.json({ hasError: true, data: {}, error: error })
                    });
                break;
            case '2'://outbox
            var count = await model.Transactions.count({where: { from : ethereumAddress }});
            model.Transactions.findAll({where: {from : ethereumAddress }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                .then(data => {
                    res.json({ hasError: false, data: {owner: ethereumAddress, count : count, transactions : data}, message: 'Get transactions successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
            break;
            case '3'://all
            var count = await model.Transactions.count({where: { [Op.or]: [{from: ethereumAddress}, {to: ethereumAddress}] }});
            model.Transactions.findAll({where: {[Op.or]: [{from: ethereumAddress}, {to: ethereumAddress}] }, limit: pageSize, offset: offset, order: [['createDateTime', "ASC"]] })
                .then(data => {
                    res.json({ hasError: false, data: {owner: ethereumAddress, count : count, transactions : data}, message: 'Get transactions successfully' })
                })
                .catch(error => {
                    res.json({ hasError: true, data: {}, error: error })
                });
            break;
            default:
              throw error;
        }
    },
    createTransaction: async function (req, res, next) {
        let user = await model.User.findOne({ where: { id: req.userId } });
        if (!user) return res.json({ hasError: true, data: {}, error: { message: 'User not found' } });
        let data = req.body;
        model.Transactions.create(data)
            .then(tr => {
                res.json({ hasError: false, data: {}, message: 'Transaction created successfully' })
            })
            .catch(error => {
                res.json({ hasError: true, data: {}, error: error })
            });
    },
};