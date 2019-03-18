const express = require('express')
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');


// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

// @route   GET api/users/test
// @desc    Tests post route
// @access  Public
router.get('/test', (req, res) => res.json({
    msg: 'User Works'
}))

// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post('/register', async (req, res) => {

    const {
        errors,
        isValid
    } = validateRegisterInput(req.body);
    //console.log("After body")
    //Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    //Destructuring from req.body
    const {
        email,
        name,
        password
    } = req.body
    // Find whether the email is already registered
    const user = await User.findOne({
        email
    })
    if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors)
    } else {
        //If user is not registered the fetch the gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });
        //Assign the req to a object
        const newUser = new User({
            name,
            email,
            avatar,
            password
        })
        //Get the password hashed
        bcrypt.genSalt(10, async (err, salt) => {
            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                //Save the hashed password and other values into User Table
                try {
                    const userSaved = await newUser.save()
                    res.json(userSaved)
                } catch (error) {
                    res.status(400).json(err)
                }
            })
        })
    }
})

//@route GET api/users/current
//@desc Return current user  ,Get the user name,id and email from jwt token if JWT token is used pass jwt if auth 0 is used pass auth 0 ...refer passport document
//@access Private
router.get('/current', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const {
        id,
        name,
        email
    } = req.user
    res.json({
        id,
        name,
        email
    })
})

//@route POST api/users/login
//@desc Login User / Returns jwt token
//@access Public
router.post('/login', async (req, res) => {
    const {
        errors,
        isValid
    } = validateLoginInput(req.body)
    //Check Validation
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const {
        email,
        password
    } = req.body

    //Find user by email id
    const user = await User.findOne({
        email
    })
    if (!user) {
        errors.email = 'User not found';
        return res.status(404).json(errors)
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (isMatch) {
        //User Matched 
        const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar
        } // Create Payload for jwt

        jwt.sign(payload, keys.secretOrKey, {
            expiresIn: 3600
        }, (err, token) => {
            res.json({
                success: true,
                token: 'Bearer ' + token
            })
        })
    } else {
        errors.password = 'Password inCorrect';
        return res.status(400).json(errors)
    }
})

module.exports = router;