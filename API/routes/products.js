const express = require('express');
const route = express.Router();
const Product = require('../../model/product');


// POST: Add a new product
route.post('/', async (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      // Bulk insert many products
      const savedProducts = await Product.insertMany(req.body, { ordered: false });
      res.status(201).json({
        message: `✅ ${savedProducts.length} products created successfully.`,
        products: savedProducts,
      });
    } else {
      // Single product insert
      const product = new Product(req.body);
      const savedProduct = await product.save();
      res.status(201).json({
        message: 'Product created successfully',
        product: savedProduct,
      });
    }
  } catch (err) {
    // Duplicate key error code for MongoDB
    if (err.code === 11000) {
      err.status = 409; // Conflict - duplicate product
    } else if (err.name === 'ValidationError') {
      err.status = 400; // Bad request - validation error
    }
    next(err); // Pass to global error handler
  }
});


route.get('/', async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});
route.get('/:id', async (req, res, next) => {
  try { 
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      return next(error); // Pass to global error handler
   
    }
    res.status(200).json(product);
  } catch (error) {
    next(error); 
  }
});
// GET /products/category/:categoryName
route.get('/category/:categoryName', async (req, res, next) => {
  try {
    const category = req.params.categoryName;

    const allowedCategories = ["Kids Clothes", "Maternity Wear", "Men Vests"];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "❌ Invalid category." });
    }

    const products = await Product.find({ category }).exec();
    const count = products.length;

    if (count === 0) {
      return res.status(404).json({ message: "❌ No products found in this category." });
    }

    res.status(200).json({
      count,
      products
    });
  } catch (error) {
    next(error);
  }
});


route.patch('/:id', async (req, res, next) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,            // The ID to find
      { $set: req.body },       // Only update the provided fields
      { new: true, runValidators: true } // Return updated doc & validate schema
    );

    if (!updatedProduct) {
      const error = new Error('Product not found');
      error.status = 404;
      return next(error); // Send to global error handler
    }

    res.status(200).json({
      message: '✅ Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    // Invalid ObjectId format
    if (error.name === 'CastError') {
      error.status = 400;
      error.message = 'Invalid product ID format';
    }
    // Validation errors from Mongoose
    if (error.name === 'ValidationError') {
      error.status = 400;
    }
    next(error);
  }
});

route.delete('/', async (req, res, next) => {
  try {
    const result = await Product.deleteMany({});

    if (result.deletedCount === 0) {
      const error = new Error('No products found to delete');
      error.status = 404;
      return next(error); // Send to global error handler
    }

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} product(s)`,
    });
  } catch (error) {
    next(error); // Send unexpected errors to global handler
  }
});

route.delete('/:id', async (req, res, next) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      const error = new Error('Product not found');
      error.status = 404;
      return next(error); // Pass to global error handler
    }

    res.status(200).json({
      message: '🗑️ Product deleted successfully',
      product: deletedProduct
    });
  } catch (error) {
    
    next(error);
  }
});


module.exports = route;
