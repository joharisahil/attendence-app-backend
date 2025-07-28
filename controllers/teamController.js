import User from '../models/User.js';
//import generateRandomPassword from '../utils/passwordGenerator.js';
import sendEmail from '../utils/sendEmail.js';
import bcrypt from 'bcrypt';
import {generateRandomPassword} from '../utils/passwordGenerator.js';
import Admin from "../models/Admin.js";
import Attendance from '../models/Attendance.js';
import jwt from "jsonwebtoken";

// ✅ Add Team Member
console.log("hii");

export const addTeamMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: 'Only valid @gmail.com addresses are allowed.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    if (admin.email === email) {
      return res.status(400).json({ message: 'You cannot add your own email to team.' });
    }

    // Auto-generate name from email
    const localPart = email.split('@')[0];
    const name = localPart
      .split(/[._]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const password = generateRandomPassword();

    // ✅ Include under_admin when creating the user
    const newUser = await User.create({
      name,
      email,
      password,
      role: "team",
      under_admin: admin.email  // ✅ Set under_admin to current admin’s email
    });

    // Add user to admin's teamMembers array
    admin.teamMembers.push(newUser._id);
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: 'Team member added and credentials sent via email.',
      teamMember: { name, email, role: newUser.role },
      token,
      password // ⛔ Remove in production!
    });

  } catch (err) {
    res.status(500).json({ message: 'Error adding team member', error: err.message });
  }
};


// ✅ View All Team Members (excluding self/admins)
export const getTeamMembers = async (req, res) => {
  try {
    const adminEmail = req.user.email;

    const users = await User.find(
      { role: 'team', under_admin: adminEmail },
      '-password'
    );

    const todayStr = new Date().toISOString().split('T')[0];

    // For each user, find today's attendance from the Attendance model
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const todayAttendance = await Attendance.findOne({
          email: user.email,
          date: {
            $gte: new Date(todayStr),
            $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
          }
        });

        return {
          ...user.toObject(),
          attendance: todayAttendance
            ? {
                timeIn: todayAttendance.timeIn,
                timeOut: todayAttendance.timeOut,
                inDescription: todayAttendance.inDescription,
                outDescription: todayAttendance.outDescription,
                status: todayAttendance.status
              }
            : null
        };
      })
    );

    res.json(enhancedUsers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching team members', error: err.message });
  }
};


// ✅ Remove Team Member

export const removeTeamMember = async (req, res) => {
  try {
    const { email } = req.body;

    // Step 1: Find the user by email
    const userToDelete = await User.findOne({ email });
    if (!userToDelete) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    const userId = userToDelete._id.toString(); // Convert to string for reliable comparison

    // Step 2: Delete user from User collection
    await User.deleteOne({ _id: userId });

    // Step 3: Remove user ID from Admin.teamMembers
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Filter out the user's ObjectId from the teamMembers array
    admin.teamMembers = admin.teamMembers.filter(
      (memberId) => memberId.toString() !== userId
    );

    await admin.save(); // Save updated admin doc

    // Step 4: Delete all attendance records by email
    await Attendance.deleteMany({ email });

    return res.status(200).json({
      message: 'Team member and related records removed successfully',
      removedEmail: email,
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return res.status(500).json({
      message: 'Error removing team member',
      error: error.message,
    });
  }
};



// ✅ Edit Team Member (email or role)
export const editTeamMember = async (req, res) => {
  try {
    //const { id } = req.params;
    const { email, role } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      
      { email, role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'Team member not found' });

    res.json({ message: 'Team member updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error updating team member', error: err.message });
  }
};

// ✅ View Attendance of a Specific Team Member
// controller/statusController.js

export const getTeamMemberAttendance = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: 'Only valid @gmail.com addresses are allowed.' });
    }

    // Check if the user exists and is a team member
    const user = await User.findOne({ email });
    if (!user || user.role !== 'team') {
      return res.status(404).json({ message: 'Team member not found' });
    }

    // Fetch attendance by email
    const attendance = await Attendance.find({ email }).sort({ date: -1 });

    res.status(200).json({
      email: user.email,
      attendance,
    });
  } catch (err) {
    console.error('Error fetching team member attendance:', err);
    res.status(500).json({
      message: 'Error fetching attendance',
      error: err.message,
    });
  }
};


// Mark or unmark a team member as Star Employee
// Toggle star employee status
export const toggleStarEmployee = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.role !== 'team') {
      return res.status(404).json({ message: 'Team member not found' });
    }

    user.isStarEmployee = !user.isStarEmployee;
    await user.save();

    res.status(200).json({
      message: user.isStarEmployee ? 'Marked as Star Employee' : 'Unmarked as Star Employee',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error while updating star status' });
  }
};

// Get all star employees
export const getStarEmployees = async (req, res) => {
  try {
    const starEmployees = await User.find({ isStarEmployee: true, role: 'team' }).select('-password');
    res.status(200).json(starEmployees);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching star employees' });
  }
};

