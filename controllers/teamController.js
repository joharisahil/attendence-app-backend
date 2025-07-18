import User from '../models/User.js';
import { generateRandomPassword } from '../utils/passwordGenerator.js';
// import { sendEmail } from '../utils/sendEmail.js'; // Uncomment when ready

export const addTeamMember = async (req, res) => {
  console.log("add team member called");

  try {
    const { email } = req.body;

    // ✅ Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // ✅ Check if already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // ✅ Generate password and create user
    const randomPassword = generateRandomPassword();

    const teamMember = await User.create({
      email,
      password: randomPassword,
      role: 'team',
    });

    // ✅ Send mail (optional)
    // await sendEmail(email, 'Team Access', `Your login password is: ${randomPassword}`);

    // ✅ Send final response
    res.status(201).json({
      message: 'Team member added successfully',
      member: {
        id: teamMember._id,
        email: teamMember.email,
        role: teamMember.role,
        tempPassword: randomPassword, // Remove this in production!
      },
    });

  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ message: 'Server error while adding team member' });
  }
};
