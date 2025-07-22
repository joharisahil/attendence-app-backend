import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("name email role");

      if (!user) {
        const admin = await Admin.findById(decoded.id).select("name email");

        if (admin) {
          req.user = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: "admin",
            isAdmin: true,
          };
        } else {
          return res.status(401).json({ message: "Not authorized" });
        }
      } else {
        req.user = {
          ...user.toObject(),
          isAdmin: user.role === "admin",
        };
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Token failed or expired" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ Role-based access
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// ✅ isAdmin middleware
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
};
