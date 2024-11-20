require('dotenv').config()
console.log(process.env.MONGO_URL)
const express = require("express");
const mongoose = require("mongoose");

const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
pp.use(express.static(path.join(__dirname, 'dist')));

// Handle any requests that don't match the above routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const { userRouter } = require("./routes/user");
const { courseRouter } = require("./routes/course");
const { adminRouter } = require("./routes/admin");
app.use(express.json());


app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/course", courseRouter);

async function main() {
    await mongoose.connect(process.env.MONGO_URL)
    app.listen(3000);
    console.log("listening on port 3000")
}

main() 