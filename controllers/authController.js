import User from '../models/User.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// ✅ Register - only first time for Admin
export const registerUser = async (req, res) => {
  try {
    
    const { name, email, password } = req.body;
    //console.log("admin created success 1");
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existingAdmin = await Admin.findOne({email});
    if (existingAdmin) {
      return res.status(403).json({ message: 'Admin already exists. Registration closed.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
   // console.log("yup");
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    //console.log(newAdmin);
    await newAdmin.save();
    console.log("hii@@@");
    console.log("admin created success b");
    const token = generateToken(newAdmin._id, 'admin');
    console.log("admin created success 2");
    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      email: newAdmin.email,
      role: 'admin',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ✅ Login (both admin & team)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check Admin model
    let user = await Admin.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      const token = generateToken(user._id, 'admin');
      return res.status(200).json({ token, email: user.email, role: 'admin' });
    }

    // Check User model
    user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("DB password:", user.password);
    console.log("Entered password:", password);
    console.log("Match result:", await bcrypt.compare(password, user.password));

    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id, user.role); // this can be "team"
    return res.status(200).json({ token, email: user.email, role: user.role });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Server error during login' });
  }
};
