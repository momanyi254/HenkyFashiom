const express = require('express');
const route = express.Router();
const Order = require("../../model/order");
const mongoose = require('mongoose');


route.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find().populate('products.productId');
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
});
route.post('/', async (req, res, next) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res.status(201).json({
      message: 'Order placed successfully',
      order: savedOrder,
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.uniqueOrderHash) {
      err.status = 409; // Conflict
      err.message = 'Duplicate order detected.';
    } else if (err.name === 'ValidationError') {
      err.status = 400;
    }
    next(err);
  }
});

route.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  // Validate if id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID format.' });
  }

  try {
    const order = await Order.findById(id).populate('products.productId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});
route.patch('/:id', async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID format.' });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({
      message: 'Order updated successfully.',
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete order by ID
route.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid order ID format.' });
  }

  try {
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({
      message: 'Order deleted successfully.',
      order: deletedOrder
    });
  } catch (err) {
    next(err);
  }
});
route.delete('/', async (req, res, next) => {
  try {
    const result = await Order.deleteMany({});
    res.status(200).json({
      message: `Deleted ${result.deletedCount} order(s) successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = route;


