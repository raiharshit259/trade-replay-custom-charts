import mongoose, { InferSchemaType, Schema } from "mongoose";

const missingLogoSchema = new Schema(
  {
    symbol: { type: String, required: true, trim: true, uppercase: true },
    fullSymbol: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, required: true, trim: true, lowercase: true },
    country: { type: String, required: true, trim: true, uppercase: true },
    fallbackType: { type: String, required: true, trim: true, lowercase: true },
    count: { type: Number, required: true, default: 1 },
    searchFrequency: { type: Number, required: true, default: 1 },
    userUsage: { type: Number, required: true, default: 1 },
    retryCount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["pending", "resolved", "failed", "unresolved", "unresolvable"],
      default: "pending",
    },
    nextRetryAt: { type: Date },
    lastAttemptAt: { type: Date },
    lastAttemptFailedAt: { type: Date },
    resolvedAt: { type: Date },
    lastError: { type: String, trim: true, default: "" },
    lastSeenAt: { type: Date, required: true, default: Date.now },
    firstSeenAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);

missingLogoSchema.index({ count: -1, lastSeenAt: -1 });
missingLogoSchema.index({ status: 1, retryCount: 1, lastSeenAt: -1 });
missingLogoSchema.index({ status: 1, searchFrequency: -1, userUsage: -1 });
missingLogoSchema.index({ status: 1, nextRetryAt: 1, retryCount: 1 });

export type MissingLogoDocument = InferSchemaType<typeof missingLogoSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MissingLogoModel = mongoose.models.MissingLogo || mongoose.model("MissingLogo", missingLogoSchema);
