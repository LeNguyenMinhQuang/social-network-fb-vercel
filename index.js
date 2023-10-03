require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");

// Router
const authRouter = require("./routes/auth");
const ChatboxRouter = require("./routes/chatbox");
const PostRouter = require("./routes/post");

// SocketFn

// MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.542w7.mongodb.net/socialnetwork?retryWrites=true&w=majority`
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
  }
};

connectDB();

// App
const app = express();
const server = http.createServer(app);

app.use(express.json()); // Để đọc được dữ liệu dạng json trả về.
app.use(cors()); // Để giao tiếp được với client trong localhost

app.get("/", (req, res) => res.json({ success: true, message: "hello" }));
app.use("/api/auth", authRouter);
app.use("/api/chatbox", ChatboxRouter);
app.use("/api/post", PostRouter);

const PORT = 5000;
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

server.listen(PORT, () => console.log("Server started on port:", PORT));

let users = [];
const addUser = (userId, socketId) => {
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId });
  }
  console.log("add", userId);
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
  console.log("remove");
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  // When an user connected

  // Add a user to Users
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
    console.log(users);
  });

  // Send and get message
  socket.on("sendMessage", ({ receiverId, senderId, text }) => {
    const user = getUser(receiverId);

    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
      sendAt: Date.now(),
    });
  });

  // When user disconnect
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
    console.log(users);
  });
});

module.exports = { users };
