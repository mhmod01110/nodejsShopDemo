const mongoose = require("mongoose");
const { BaseSchema } = require('./base');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    price: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },
});

// Create a new schema that inherits from BaseSchema
const ProductSchema = new Schema({}, { collection: 'products' });
ProductSchema.add(BaseSchema);
ProductSchema.add(productSchema);

module.exports = mongoose.model('Product', ProductSchema);  //export the model



