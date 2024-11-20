const { Router } = require("express");
const { userModel, purchaseModel, courseModel } = require("../db");
const jwt = require("jsonwebtoken");
const  { JWT_USER_PASSWORD } = require("../config");
const { userMiddleware } = require("../middleware/user");
const bcrypt = require("bcrypt");
const {z} = require("zod");
const userRouter = Router();
userRouter.post("/signup", async function(req, res) {
    const requirebody = z.object({
        email:z.string().min(3).max(50).email(),
        firstName:z.string().min(5).max(100),
        lastName:z.string().min(5).max(20),
        password:z.string().min(8).max(20).refine((password)=>{
            const uppercase = /[A-Z]/.test(password);
            const lowercase = /[a-z]/.test(password);
            const specialchar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            return uppercase && lowercase && specialchar;
        }, {
            message: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one special character."
        })
    });
    const parsedata = requirebody.safeParse(req.body);
    if(!parsedata.success){
        res.json({
            message:"incorrect detial",
            error:parsedata.error
        })
        return 
    }
    const email = req.body.email;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    let errorthrown = false;
    try{
        const hashpassword = await bcrypt.hash(password,5);
        await  userModel.create({
            email:email,
            password:hashpassword,
            firstName:firstName,
            lastName:lastName
        })
    }catch(e){
        res.status(403).json({
            error:e.message
        })
        errorthrown = true
    }
    if(!errorthrown){
        res.json({
            message:"You Are successfuly login"
        })
    }
})
userRouter.post("/signin", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const response = await userModel.findOne({
        email:email
    })
    if(!response){
        res.status(403).json({
            message:"User does not exist"
        })
        return 
    }
    try{
        const comparepassword = await bcrypt.compare(password,response.password);
        if(comparepassword){
            const token = jwt.sign({
                id:response._id.toString()
            },JWT_USER_PASSWORD);
            res.json({
                message:"You successfully logged in",
                token:token
            })
        }
    }catch(error){
        res.status(403).json({
            message:"Wrong username or password:",
            error:error.message
        })
    }
})

userRouter.get("/purchases", userMiddleware, async function(req, res) {
    const userId = req.userId;

    const purchases = await purchaseModel.find({
        userId,
    });

    let purchasedCourseIds = [];

    for (let i = 0; i<purchases.length;i++){ 
        purchasedCourseIds.push(purchases[i].courseId)
    }

    const coursesData = await courseModel.find({
        _id: { $in: purchasedCourseIds }
    })

    res.json({
        purchases,
        coursesData
    })
})

module.exports = {
    userRouter: userRouter
}