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

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 2. Validate proper Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: 'Only valid @gmail.com addresses are allowed.' });
    }

    // 3. Check if the email already exists as a team member
    const existingTeamUser = await User.findOne({ email });
    if (existingTeamUser) {
      return res.status(409).json({ message: 'This email is already registered as a team member.' });
    }

    // 4. Check if an admin already exists
      const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin with this email already exists.' });
    }

    // 5. Register admin
    const hashedPassword = await bcrypt.hash(password, 10);
   // console.log("yup");
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    //console.log(newAdmin);
    await newAdmin.save();
    //console.log("hii@@@");
    //console.log("admin created success b");
    const token = generateToken(newAdmin._id, 'admin');
    //console.log("admin created success 2");
    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      email: newAdmin.email,
      role: 'admin',
    });
  } catch (err) {
    console.error('Error in registerUser:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ✅ Login (both admin & team)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check Admin model
    let user = await Admin.findOne({ email });
    //console.log(user);
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      //console.log(isMatch);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      const token = generateToken(user._id, 'admin');
      return res.status(200).json({ token, email: user.email, role: 'admin' });
    }

    // Check User model
    user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    //console.log("DB password:", user.password);
    //console.log("Entered password:", password);
    //console.log("Match result:", await bcrypt.compare(password, user.password));

    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id, user.role); // this can be "team"
    return res.status(200).json({ token, email: user.email, role: user.role });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ token }); // front-end will use this to send the email
  } catch (err) {
   console.error("Error generating reset token:", err);
    res.status(500).json({ message: 'Error generating reset token' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get new password from request body
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
