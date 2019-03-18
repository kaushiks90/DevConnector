const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load Validations
const validateProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");

//Load Models
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get("/test", (req, res) =>
  res.json({
    msg: "Profile works"
  })
);

//@route Get api/profile
//@desc Get current user profile
//@access Private
router.get(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const errors = {};

    try {
      const profile = await Profile.findOne({
        user: req.user.id
      }).populate("user", ["name", "avatar"]);
      if (!profile) {
        errors.noProfile = "There is no profile for this user";
        return res.status(404).json(errors);
      }
      res.json(profile);
    } catch (err) {
      res.status(404).json(err);
    }
  }
);

//@route Get api/profile/all
//@desc Get all the profiles
//@access Public
router.get("/all", async (req, res) => {
  const errors = {};

  try {
    const profile = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profile) {
      errors.noProfile = "There is no profiles";
      return res.status(404).json(errors);
    }
    res.json(profile);
  } catch (err) {
    res.status(404).json(err);
  }
});

//@route Get api/profile/handle/:handle
//@desc Get profile by handle
//@access public
router.get("/handle/:handle",
  passport.authenticate("jwt", {
    session: false
  }), async (req, res) => {
    const errors = {};
    try {
      const profile = await Profile.findOne({
        handle: req.params.handle
      }).populate("user", ["name", "avatar"]);
      if (!profile) {
        errors.noProfile = "There is no profiles";
        return res.status(404).json(errors);
      }
      res.json(profile);
    } catch (error) {
      res.json(error);
    }
  });

//@router /api/profile/user/:user_id
//@desc Get profile by userId
//@access Public
router.get("/user/:user_id",
  passport.authenticate("jwt", {
    session: false
  }), async (req, res) => {
    const errors = {};
    try {
      const profile = await Profile.findOne({
        user: req.params.user_id
      }).populate("user", ["name", "avatar"]);
      if (!profile) {
        errors.noProfile = "There are no profile";
        return res.status(404).json(errors);
      }
      res.json(profile);
    } catch (error) {
      res.json(error);
    }
  });

//@router Post api/profile
//@desc Create or edit user profile
//@router Private
router.post(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    //console.log(req.body)
    const {
      errors,
      isValid
    } = validateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    let {
      handle,
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = req.body;
    const profileFields = {};
    profileFields.user = req.user.id;
    if (handle) profileFields.handle = handle;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;
    //Skills split into array
    if (typeof skills !== "undefined") {
      profileFields.skills = skills.split(",");
    }
    const profile = await Profile.findOne({
      user: req.user.id
    });
    if (profile) {
      //Update
      try {
        const updatedProfile = await Profile.findOneAndUpdate({
          user: req.user.id
        }, {
          $set: profileFields
        }, {
          new: true
        });
        res.json(updatedProfile);
      } catch (error) {
        res.json(error);
      }
    } else {

      const handleExists = await Profile.findOne({
        handle
      });
      if (handleExists) {
        errors.handle = "That handle already exists";
        res.status(400).json(errors);
      }
      try {
        // console.log("Profile")
        const newProfile = await new Profile(profileFields).save();
        res.json(newProfile);
      } catch (error) {
        res.json(error);
      }
    }
  }
);

//@route Post api/profile/experience
//@desc Add experience to profile
//@access Private
router.post(
  "/experience",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const {
      errors,
      isValid
    } = validateExperienceInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;
    if (profile) {
      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      };
      profile.experience.unshift(newExp);
      const result = await profile.save();
      res.json(result);
    }
  }
);

//@route Post api/profile/education
//@desc Add education to profile
//@access Private
router.post(
  "/education",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const {
      errors,
      isValid
    } = validateEducationInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;
    if (profile) {
      const newExp = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      };
      await profile.education.unshift(newExp);
      const result = await profile.save();
      res.json(result);
    }
  }
);

//@route Delete api/profile/experience/:exp_id
//@desc Delete experience from profile
//@access Private
router.delete(
  "/experience/:exp_id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const experienceId = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(experienceId, 1);
    try {
      const result = await profile.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@route Delete api/profile/education/:edu_id
//@desc Delete education from profile
//@access private
router.delete(
  "/education/:edu_id",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    const profile = await Profile.findOne({
      user: req.user.id
    });
    const educationId = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(educationId, 1);
    try {
      const result = await profile.save();
      res.json(result);
    } catch (error) {
      res.json(error);
    }
  }
);

//@route Delete api/profile
//@desc Delete user and profile
//@access private
router.delete(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  async (req, res) => {
    try {
      await Profile.findOneAndRemove({
        user: req.user.id
      });
      await User.findOneAndRemove({
        _id: req.user.id
      });
      res.json({
        success: true
      });
    } catch (error) {}
  }
);

module.exports = router;