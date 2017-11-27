const productRouter = require('express').Router();
const Product = require('../models/product');


/* GET PRODUCTS */
productRouter.get('/', function(req,res){
    Product.find(function (err, data) {
        if (err) return next(err);
        return res.json(data);
    });
});

/* SAVE PRODUCT */
productRouter.post('/', function (req, res, next) {
    Product.create(req.body, function (err, post) {
        if (err) return next(err);
        return res.json(post); 
    });
});

/* GET SINGLE BOOK BY ID */
productRouter.get('/:id', function (req, res, next) {
    Product.findById(req.params.id, function (err, post) {
        if (err) return next(err);
        return res.json(post);
    });
});

/* UPDATE PRODUCT */
productRouter.put('/:id', function (req, res, next) {
    Product.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
        if (err) return next(err);
        res.json(post);
    });
});

/* DELETE PRODUCT */
productRouter.delete('/:id', function (req, res, next) {
    Product.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) return next(err);
        res.json(post);
    });
});

module.exports = productRouter;