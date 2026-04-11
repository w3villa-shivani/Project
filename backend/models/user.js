//user.js


// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: String,

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     password: String,

//     provider: {
//       type: String,
//       enum: ["local", "google", "facebook", "microsoft"],
//       default: "local",
//     },

//     providerId: String,

//     // OAuth tokens (optional, for future API calls)
//     OAuthTokens: {
//       google: {
//         accessToken: String,
//         refreshToken: String,
//       },
//       facebook: {
//         accessToken: String,
//       },
//       microsoft: {
//         accessToken: String,
//         refreshToken: String,
//       },
//     },

//     // Profile image from OAuth
//     profileImage: {
//       type: String,
//     },

//     address: {
//       type: String,
//     },

//     location: {
//       lat: {
//         type: Number,
//       },
//       lng: {
//         type: Number,
//       },
//     },

//     /* ===== PRICING PLANS ===== */
//     plan: {
//       type: String,
//       enum: ["free", "silver", "gold"],
//       default: "free",
//     },

//     planExpiration: {
//       type: Date,
//     },

//     planStatus: {
//       type: String,
//       enum: ["active", "expired"],
//       default: "active",
//     },

//     // role field for authorization
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },

//     /* ===== EMAIL VERIFICATION ===== */
//     isEmailVerified: {
//       type: Boolean,
//       default: false,
//     },

//     verificationToken: {
//       type: String,
//     },

//     // Soft delete flag
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }

// );

// const User = mongoose.model("User", userSchema);
// export default User;



import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {name: String,

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: String,

    provider: {
      type: String,
      enum: ["local", "google", "facebook", "microsoft"],
      default: "local",
    },

    providerId: String,

    // OAuth tokens (optional, for future API calls)
    OAuthTokens: {
      google: {
        accessToken: String,
        refreshToken: String,
      },
      facebook: {
        accessToken: String,
      },
      microsoft: {
        accessToken: String,
        refreshToken: String,
      },
    },

    // Profile image from OAuth
    profileImage: {
      type: String,
    },

    address: {
      type: String,
    },

    location: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },

    /* ===== PRICING PLANS ===== */
    plan: {
      type: String,
      enum: ["free", "silver", "gold"],
      default: "free",
    },

    planExpiration: {
      type: Date,
    },

    planStatus: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },

    // role field for authorization
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ===== EMAIL VERIFICATION ===== */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
    },

    tokenGeneratedAt: {
      type: Date,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }

);

const User = mongoose.model("User", userSchema);
export default User;