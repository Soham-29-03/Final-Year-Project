import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { findUserById } from "../repositories/user.repo.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw ApiError.unauthorized("Not authorized, no token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

    const user = await findUserById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized("Not authorized, user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};