import mongoose from "mongoose";

const shortUrlSchema = new mongoose.Schema({

  full_url: {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  expiresAt:{
    type:Date,
    default: null,
  },
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, {
  timestamps:true,
});

shortUrlSchema.index(
  {expiresAt:1},
  {expireAfterSeconds:0,sparse:true} //tells MongoDB to expire documents at the date stored in expiresAt.
);

const shortUrlModel = mongoose.model("shortUrl", shortUrlSchema);

export default shortUrlModel;
