const express = require("express");
const router = express.Router();

const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

// Register - POST - api/auth/register

router.post("/register", async (req, res) => {
    const { username, password, photoUrl } = req.body;

    //   Check username and password
    if (!username || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Missing username and/or password!" });
    }
    try {
        //   Check existing user
        const existUser = await User.findOne({ username });
        if (existUser) {
            return res.status(400).json({ success: false, message: "Username already taken!" });
        }

        // No existing user -> hash password
        const hashedPassword = await argon2.hash(password);

        // Save new user
        const newUser = new User({
            username,
            password: hashedPassword,
            photoUrl,
        });

        await newUser.save();

        // Return access token
        const accessToken = jwt.sign({ userId: newUser._id }, process.env.SECURITY_TOKEN);

        // Success

        res.json({
            success: true,
            message: "User created succesfully!",
            accessToken: accessToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});

// Login - POST - api/auth/login

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Check username and password
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password!" });
    }

    try {
        // Check existing user
        const existUser = await User.findOne({ username });
        if (!existUser) {
            return res.status(400).json({ success: false, message: "Incorrect username!" });
        }
        // Existing user found
        const passwordValid = await argon2.verify(existUser.password, password);
        if (!passwordValid) {
            return res.status(400).json({ success: false, message: "Incorrect password!" });
        }
        // Password correct then return token
        const accessToken = jwt.sign({ userId: existUser._id }, process.env.SECURITY_TOKEN);

        res.json({
            success: true,
            message: "Login succesfully!",
            accessToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});

// Check if user is logged in - GET - api/auth

router.get("/", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(["-password"]);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }
        res.json({ success: true, message: "User is logged in", user });
    } catch (error) {
        res.status(500).message({ success: false, message: "Server error" });
    }
});

// Change password - PUT - api/auth/changepassword

router.put("/changepassword", verifyToken, async (req, res) => {
    const { password, newPassword } = req.body;

    try {
        let existUser = await User.findById(req.userId);
        if (!existUser) {
            return res.status(400).json({ success: false, message: "User doens't exist!" });
        }
        const passwordValid = await argon2.verify(existUser.password, password);
        if (!passwordValid) {
            return res.status(400).json({ success: false, message: "Incorect password!" });
        }
        const updateContent = { password: await argon2.hash(newPassword) };
        const updateCondition = { _id: req.userId };
        let updatePass = await User.findOneAndUpdate(updateCondition, updateContent, { new: true });

        if (!updatePass) {
            return res.status(401).json({ success: false, message: "Can't change password!" });
        }

        res.json({
            success: true,
            message: "Password changed!",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});

// Change information - PUT - api/auth/:id/update

router.put("/user/:id/update", verifyToken, async (req, res) => {
    if (req.params.id != req.userId) {
        return res.status(401).json({
            success: false,
            message: "Cannot change information of other people!",
        });
    }
    try {
        const existUser = await User.findById(req.params.id);
        if (!existUser) {
            return res.status(400).json({ success: false, message: "User doens't exist!" });
        }

        const updateContent = { ...req.body };
        const updateCondition = { _id: req.userId };
        const updateInfo = await User.findOneAndUpdate(updateCondition, updateContent, {
            new: true,
        });
        if (!updateInfo) {
            return res.status(401).json({ success: false, message: "Can't change information!" });
        }
        res.json({
            success: true,
            message: "Information changed!",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});

// Get information of an User

router.get("/user/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        res.json({ success: true, message: "User found", user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// get All user

router.get("/all", async (req, res) => {
    try {
        const allUser = await User.find({}).select(["-password"]);
        if (!allUser) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        res.json({ success: true, message: "User found", allUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// add friend

router.post("/addfriend", verifyToken, async (req, res) => {
    const { guestId } = req.body;
    try {
        const user = await User.findById(req.userId);
        let { friend } = user;
        if (!friend.includes(guestId)) {
            const updateContent = { friend: [...friend, guestId] };
            const updateCondition = { _id: req.userId };
            const addFriend = await User.findOneAndUpdate(updateCondition, updateContent, {
                new: true,
            });
            if (!addFriend) {
                return res.status(400).json({ success: false, message: "Cannot add friend" });
            }
            try {
                const user = await User.findById(guestId);
                let { friend } = user;
                if (!friend.includes(req.userId)) {
                    const updateContent = { friend: [...friend, req.userId] };
                    const updateCondition = { _id: guestId };
                    const addFriend = await User.findOneAndUpdate(updateCondition, updateContent, {
                        new: true,
                    });
                    if (!addFriend) {
                        return res
                            .status(400)
                            .json({ success: false, message: "Cannot add friend" });
                    }
                }

                res.json({ success: true });
            } catch (error) {
                console.log(error);
                res.status(500).json({ success: false, message: "Server error!" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error!" });
    }
});

module.exports = router;
