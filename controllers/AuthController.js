const { promisify } = require('util');
const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const createJwt = (id, type) => {
    let token = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
        expiresIn: type === 'refresh' ? process.env.REFRESH_JWT_EXPIRES_IN : process.env.ACCESS_JWT_EXPIRES_IN,
    });
    return token;
}

const sendResponse = (res, userId, user) => {                                                         //   refresh -> 15 min   access -> 5 min

    // create jwt
    const accessToken = createJwt(userId, 'access');
    const refreshToken = createJwt(userId, 'refresh');
    // attach http only cookie to response object

    res.cookies("refreshToken", refreshToken, {
        httpOnly: true,
    });

    // send response object
    res.status(200).json({
        status: "success",
        accessToken,
        data: {
            user
        }
    })
}

exports.signUp = async (req, res) => {
    try {

        // check if user is already present
        const isExist = await User.findOne({ email: req.body.email });
        if (isExist) {
            return res.status(400).json({
                status: "fail",
                message: "User already exists !"
            });
        }

        // create new user
        const newUser = new User(req.body);
        newUser.save();

        // create and send jwt token
        sendResponse(res, newUser._id, newUser);

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;

        // check if email is valid 
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                status: "fail",
                message: "Email or password is incorrect !",
            });
        }

        // check if password is correct
        const check = await bcrypt.compare(password, user.password);

        if (!check) {
            return res.status(400).json({
                status: "fail",
                message: "Email or password is incorrect !",
            });
        }

        // send response
        sendResponse(res, user._id, user);

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

exports.logout = async (req, res) => {
    try {
        res.cookies('refreshToken', "expired", {
            expires: new Date(Date.now() + 10*1000),
            httpOnly: true,
        })

        res.status(200).json({
            status: 'success',
            message: 'User logged out successfully'
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

exports.refresh = async (req, res) => {
    try {
        
        // get token
        let refreshToken;
        if (req.cookies.refreshToken) {
            refreshToken = req.cookies.refreshToken;
        }

        if (!refreshToken) {
            return res.status(401).json({ status: "fail", message: 'you are not logged in !' });
        }

        // is token valid
        const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ status: "fail", message: "This user no longer exists !" });
        }

        // send response
        const newAccessToken = createJwt(user._id, 'access');

        res.status(200).json({
            status: "success",
            accessToken: newAccessToken,
            data: {
                user
            }
        })

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}

// middleware
exports.protect = async (req, res, next) => {

    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: "fail",
                message: "You are not logged in !"
            })
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ status: "fail", message: "This user no longer exists !" });
        }

        //attaching user to req object
        req.user = user;

        next();
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
}