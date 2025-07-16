import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register
export const registerUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
  console.log("Role", role);
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ email, password, role });
    console.log(user.role);
    const token = generateToken(user._id, user.role);

    res.status(201).json({ token, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);
    res.json({ token, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
};
