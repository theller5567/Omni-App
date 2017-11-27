const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    product_name: String,
    sku: String,
    description: String,
    product_link: String,
    cat_id: String,
    cat_name: String,
    diameter: String,
    length: String,
    type: String,
    window_size: String,
    related_products: Array,
    sub_cat_name: String,
    price: Number,
    quantity: Number,
    images: [{
        thumbnail: String,
        small: String,
        large: String
    }],
    volume: String,
});


module.exports = mongoose.model('Product', productSchema);