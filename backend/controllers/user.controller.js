import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import {v2 as cloudinary} from 'cloudinary';

export const getUserProfile=async(req,res)=>{
    const {userName}=req.params;

    try{
        const user=await User.findOne({userName}).select('-password');
        if(!user)
        {
            return res.status(404).json({message:'User Not Found'});
        }
        res.status(200).json(user);
    }
    catch(error)
    {
        res.status(500).json({error:error.message});
        console.log('Error in getUserProfile:',error.message);
    }
}

export const followUnfollowUser=async(req,res)=>{
    try{
        const {id}=req.params;
        const userToModify=await User.findById(id);
        const currentUser=await User.findById(req.user._id);
        
        if(id===req.user._id.toString()) 
        {
            return res.status(400).json({error:'User cannot follow himself'});
        }

        if(!userToModify || !currentUser)
        {
            return res.status(400).json({error:'User not found'});
        }

        const isFollowing=currentUser.following.includes(id);
        if(isFollowing)
        {
            await User.findByIdAndUpdate(id,{$pull:{followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$pull:{following:id}}); 
            res.status(200).json({message:'User unfollowed successfully'});
        }

        else{
            await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$push:{following:id}});

            const newNotification=new Notification({
                type:'follow',
                from:req.user._id,
                to:userToModify._id,
                

            })
            await newNotification.save();
            res.status(200).json({message:'User followed successfully'});
        }

    }catch(error)
    {
        console.log('Error in followUnfollow Controller',error.message);
        res.status(500).json({message:'Internal Server Error'}); 
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Fetch the list of users followed by the current user
      const currentUser = await User.findById(userId).select('following');
      const usersFollowedByMe = currentUser.following;
  
      // Find suggested users (exclude current user and users they already follow)
      const users = await User.aggregate([
        {
          $match: {
            _id: { $ne: userId }, // Exclude the current user
          },
        },
        { $sample: { size: 10 } }, // Randomly sample 10 users
        {
          $project: {
            password: 0, // Exclude sensitive fields
            email: 0,
          },
        },
      ]);
  
      // Filter out users already followed
      const filteredUsers = users.filter(
        (user) => !usersFollowedByMe.includes(user._id.toString())
      );
  
      // Return the top 4 suggested users
      const suggestedUsers = filteredUsers.slice(0, 4);
  
      res.status(200).json(suggestedUsers);
    } catch (error) {
      console.log('Error in getSuggestedUsers:', error.message);
      res.status(500).json({ error: error.message });
    }
  };
  
  export const updateUserProfile = async (req, res) => {
    const { fullName, userName, email, password, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;
    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if ((!currentPassword && newPassword) || (!newPassword && currentPassword)) {
            return res.status(400).json({ error: 'Please provide both current password and new password' });
        }

        if (currentPassword && newPassword) {
            if(currentPassword===newPassword)
            {
                return res.status(400).json({error:'New Password cannot be the same as the Current Password'});
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Current Password is incorrect' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg) {
            // Handle profile image update
            if(user.profileImg)
            {
                await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0]);
            }

            const uploadedResponse=await cloudinary.uploader.upload(profileImg);
            profileImg=uploadedResponse.secure_url;
        }

        if (coverImg) {
            if(user.coverImg)
                {
                    await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0]);
                }
            // Handle cover image update
            const uploadedResponse=await cloudinary.uploader.upload(coverImg);
            coverImg=uploadedResponse.secure_url;
        }

        // Update other fields if provided
        if (fullName) user.fullName = fullName;
        if (userName) user.userName = userName;
        if (email) user.email = email;
        if (bio) user.bio = bio;
        if (link) user.link = link;
        if(profileImg) user.profileImg=profileImg;
        if(coverImg) user.coverImg=coverImg;

        user=await user.save();
        user.password=null;


        return res.status(200).json({ message: 'Profile updated successfully', user });

    } catch (error) {
        console.log('Error in updateUserProfile controller',error);
        return res.status(500).json({ error: 'Internal server error' });
        
    }
};
