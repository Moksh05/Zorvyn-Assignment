import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ITag extends Document {
  name: string;
  color: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, "Tag name cannot exceed 50 characters"],
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
    },
  },
  { timestamps: true }
);

export const Tag: Model<ITag> = mongoose.model<ITag>("Tag", TagSchema);
