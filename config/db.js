const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log("Mongoose connected...");
  } catch (err) {
    console.error(err.message);
    //Exit process with error
    process.exit(1);
  }
};

module.exports = connectDB;
