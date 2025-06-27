import { User } from "../models/userModel.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/dataURI.js"
import cloudinary from "../utils/cloudinary.js"


// register controller
export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body

        // if any of the above value is not available
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            })
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({
                message: "Profile photo is required",
                success: false
            });
        }

        const fileUri = getDataUri(file)
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content)

        const user = await User.findOne({ email })

        // check if email already exists or not
        if (user) {
            return res.status(400).json({
                message: "User already exists with this email",
                success: false
            })
        }

        // hash the password along with a salt value using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto: cloudResponse.secure_url
            }
        })

        return res.status(201).json({
            message: "Account created successfully",
            success: true
        })

    } catch (error) {
        console.error("Error in register controller:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}



// login controller
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body

        // if any of the above value is not available
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            })
        }

        let user = await User.findOne({ email })

        // check if email is correct or not
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false
            })
        }

        // check if password is correct or not
        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password",
                success: false
            })
        }

        // check if role is correct or not 
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role",
                success: false
            })
        }

        const tokenData = {
            userId: user._id
        };


        // generate a jsonwebtoken
        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' })

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        // store the jwt in cookie
        return res.status(200).cookie("token", token, {
            maxAge: 1 * 24 * 60 * 60 * 1000,
            httpOnly: true,  // Prevent JavaScript access
            secure: true,    // Only allow over HTTPS (useful in production)
            sameSite: "strict" // Prevent CSRF attacks

        }).json({
            message: `welcome back ${user.fullname}`,
            user,
            success: true
        })

    } catch (error) {
        console.error("Error in login controller:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}



// logout controller
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "logged out successfully",
            success: true
        })

    } catch (error) {
        console.error("Error in logout controller:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}



//update controller
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                message: "Resume file is required",
                success: false
            });
        }


        //cloudinary code 
        const fileUri = getDataUri(file)
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content)


        let skillsArray
        if (skills) {
            skillsArray = skills.split(",")
        }

        const userId = req.id       // middleware authentication
        let user = await User.findById(userId)

        if (!user) {
            return res.status(400).json({
                message: "user not found",
                success: false
            })
        }

        //updating data
        if (fullname) user.fullname = fullname
        if (email) user.email = email
        if (phoneNumber) user.phoneNumber = phoneNumber
        if (bio) user.profile.bio = bio
        if (skills) user.profile.skills = skillsArray

        //resume code
        if (cloudResponse) {
            user.profile.resume = cloudResponse.secure_url      // save the cloudinary url
            user.profile.resumeOriginalName = file.originalname     // save the original file name 
        }

        await user.save()

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message: "Profile updated Successfully",
            user,
            success: true
        })

    } catch (error) {
        console.error("Error in updateProfile controller:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            success: false
        });
    }
}  