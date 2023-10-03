const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Chatbox = require("../models/Chatbox");

const verifyToken = require("../middleware/verifyToken");

// send a message

router.post("/message/send/:guestId", verifyToken, async (req, res) => {
  const { text } = req.body;
  const senderId = req.userId;
  try {
    const chatbox = await Chatbox.find({
      members: { $all: [req.userId, req.params.guestId], $size: 2 },
    });

    if (!chatbox) {
      return res
        .json(400)
        .json({ success: false, message: "Chat box not found" });
    }
    let [{ _id, messages }] = chatbox;

    if (!messages) {
      return res
        .status(400)
        .json({ success: false, message: "no messages in chat box" });
    }
    let newMessage = {
      senderId,
      text,
      sendAt: Date.now(),
    };

    const updateContent = { messages: [...messages, newMessage] };
    const updateCondition = { _id: _id };

    const updateInfo = await Chatbox.findOneAndUpdate(
      updateCondition,
      updateContent,
      { new: true }
    );

    const updateMessages = updateInfo.messages;

    if (!updateInfo) {
      return res
        .status(401)
        .json({ success: false, message: "Can't send message" });
    }

    console.log("update:", updateInfo);
    console.log("message:", updateMessages);

    res.json({
      success: true,
      message: "Message send",
      messages: updateMessages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
});

// create new chat box

router.post("/", verifyToken, async (req, res) => {
  const { guestId } = req.body;

  try {
    const existChatbox = await Chatbox.find({
      members: { $all: [req.userId, guestId], $size: 2 },
    });

    if (existChatbox.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Chat box already exist" });
    }
    const newChatbox = new Chatbox({
      members: [req.userId, guestId],
    });
    await newChatbox.save();

    res.json({
      success: true,
      message: `Chat box of ${guestId} and ${req.userId} has created!`,
      chatbox: newChatbox,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
});

// get all chat box of user

router.get("/message", verifyToken, async (req, res) => {
  try {
    const chatboxlist = await Chatbox.find({
      members: { $all: [req.userId], $size: 2 },
    });
    if (!chatboxlist) {
      return res
        .status(400)
        .json({ success: false, message: "User doesn't have any chat box" });
    }
    res.json({
      success: true,
      message: "chat List found",
      chatList: chatboxlist,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
});

// get chat box form an user

router.get("/:guestId", verifyToken, async (req, res) => {
  try {
    const chatbox = await Chatbox.find({
      members: { $all: [req.userId, req.params.guestId], $size: 2 },
    });
    if (!chatbox) {
      return res
        .json(400)
        .json({ success: false, message: "Chat box not found" });
    }
    res.json({ success: true, message: "Chat box found", chatbox });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error!" });
  }
});

module.exports = router;
