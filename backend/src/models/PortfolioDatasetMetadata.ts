import mongoose, { InferSchemaType, Schema } from "mongoose";

const portfolioDatasetMetadataSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["real", "13f", "simulated"] },
    s3Key: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);

portfolioDatasetMetadataSchema.index({ type: 1, createdAt: -1 });

export type PortfolioDatasetMetadataDocument = InferSchemaType<typeof portfolioDatasetMetadataSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PortfolioDatasetMetadataModel = mongoose.models.PortfolioDatasetMetadata
  || mongoose.model("PortfolioDatasetMetadata", portfolioDatasetMetadataSchema);
