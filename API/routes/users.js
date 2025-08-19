const express = require('express');
const route = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../../model/user');
const checkAuth = require('../middleware/checkAuth');


route.post('/signup', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });

    const savedUser = await user.save();
    res.status(201).json({
      message: 'User created successfully',
      userId: user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

route.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Auth failed: User not found' });
    }

    const match = await user.comparePassword(password); 
    if (!match) {
      return res.status(401).json({ message: 'Auth failed: Wrong password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Auth successful',
      token
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

route.delete('/', async (req, res) => {
  try {
    await User.deleteMany({});
    res.status(200).json({ message: "All users deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


route.delete('/:userId', checkAuth, async (req, res) => {
  try {
    // Optional: Ensure only the logged-in user can delete their own account
    if (req.userData.userId !== req.params.userId) {
      return res.status(403).json({ message: 'You can only delete your own account' });
    }

    await User.deleteOne({ _id: req.params.userId });
    res.status(200).json({ message: 'User deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = route;
