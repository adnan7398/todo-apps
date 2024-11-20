const { Router } = require("express");
const adminRouter = Router();
const { adminModel, courseModel } = require("../db");
const jwt = require("jsonwebtoken");
const  { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin");
const bcrypt = require("bcrypt");
const {z} = require("zod");

adminRouter.post("/signup",async function(req,res){
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
    })
    const parsedata = requirebody.safeParse(req.body);
    if(!parsedata.success){
        res.json({
            message:"wrong credintial",
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
        await adminModel.create({
            email:email,
            password:hashpassword,
            firstName:firstName,
            lastName:lastName
        })
    }catch(error){
        res.status(403).json({
            error:error.message
        })
        errorthrown = true;
    }
    if(!errorthrown){
        res.json({
            message:"You are successfully login"
        })
    }
})
adminRouter.post("/signin",async function(req,res){
    const email = req.body.email;
    const password = req.body.password;
    const response = await adminModel.findOne({
        email:email
    })
    if(!response){
        res.json({
            message:"user dosn't exist"
        });
        return;
    }
    try{
        const comparepassword = await bcrypt.compare(password,response.password);
        if(comparepassword){
            const token = jwt.sign({
                id:response._id.toString()
            },JWT_ADMIN_PASSWORD);
            res.json({
                message:"you are successfully logged in",
                token:token
            })
        }
    }catch(error){
        res.status(403).json({
            message:"wrong username or password",
            error:error.message
        })
    }
})
adminRouter.post("/course", adminMiddleware, async function(req, res) {
    const adminId = req.userId;

    const { title, description, imageUrl, price } = req.body;

    const course = await courseModel.create({
        title: title, 
        description: description, 
        imageUrl: imageUrl, 
        price: price, 
        creatorId: adminId
    })

    res.json({
        message: "Course created",
        courseId: course._id
    })
})

adminRouter.put("/course", adminMiddleware, async function(req, res) {
    const adminId = req.userId;

    const { title, description, imageUrl, price, courseId } = req.body;

    const course = await courseModel.updateOne({
        _id: courseId, 
        creatorId: adminId 
    }, {
        title: title, 
        description: description, 
        imageUrl: imageUrl, 
        price: price
    })

    res.json({
        message: "Course updated",
        courseId: course._id
    })
})

adminRouter.get("/course/bulk", adminMiddleware,async function(req, res) {
    const adminId = req.userId;

    const courses = await courseModel.find({
        creatorId: adminId 
    });

    res.json({
        message: "Course updated",
        courses
    })
})

module.exports = {
    adminRouter: adminRouter
}