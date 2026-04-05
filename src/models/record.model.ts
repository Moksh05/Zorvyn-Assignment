import mongoose, { Document, Schema, Model, Types, Query } from "mongoose";

export interface IRecord extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: Date;
  tags: Types.ObjectId[];
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema = new Schema<IRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be at least 0.01"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
      index: true,
    },
    tags: {
      type: [Schema.Types.ObjectId],
      ref: "Tag",
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes
RecordSchema.index({ userId: 1, date: -1 });
RecordSchema.index({ category: 1 });
RecordSchema.index({ tags: 1 });

// Pre-find middleware: auto-filter deleted unless explicitly asked
RecordSchema.pre<Query<unknown, IRecord>>(/^find/, function (next) {
  const options = this.getOptions() as Record<string, unknown>;
  if (!options["includeDeleted"]) {
    this.where({ isDeleted: false });
  }
  next();
});

export const FinancialRecord: Model<IRecord> = mongoose.model<IRecord>(
  "Record",
  RecordSchema
);
