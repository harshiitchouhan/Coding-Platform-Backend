const express = require("express");
const adminMiddleware = require("../Middleware/adminMiddleware");

const {getAllUsers,getSingleUser,toggleBanUser,changeUserRole,deleteUserByAdmin} = require("../Controllers/adminController");

const adminRouter = express.Router();

adminRouter.get("/users", adminMiddleware, getAllUsers);

adminRouter.get("/users/:id", adminMiddleware, getSingleUser);

adminRouter.patch("/users/:id/ban", adminMiddleware, toggleBanUser);

adminRouter.patch("/users/:id/role", adminMiddleware, changeUserRole);

adminRouter.delete("/users/:id", adminMiddleware, deleteUserByAdmin);

module.exports = adminRouter;