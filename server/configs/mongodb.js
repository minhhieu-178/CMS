import mongoose from "mongoose";

// Connect MongoDB

const connectDB = async ()=>{
    mongoose.connection.on('connected', ()=> console.log('Database Connected'))

    await mongoose.connect(`${process.env.MONGODB_URI}/lms`)
}

export default connectDB