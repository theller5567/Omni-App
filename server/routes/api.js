
const express = require('express');
const router = express.Router()
const mongoose = require('mongoose');
const product = require('../models/product');

const db = "mongodb://theller5567:Noel1124#$@ds147377.mlab.com:47377/heroku_pwwmd9c8";

mongoose.Promise = global.Promise;

const options = {
  useMongoClient: true
}

mongoose.connect(db, options, function(err){
    if(err){
        console.log('Connection Error');
    }
});


router.get('/products', function(req,res){
    product.find({})
        .exec(function(err, products){
            if(err){
                console.log('Error getting the products');
            } else {
                res.json(products);
            }
        });
});

module.exports = router;