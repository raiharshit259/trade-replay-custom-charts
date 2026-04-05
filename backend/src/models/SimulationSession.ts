import mongoose, { InferSchemaType, Schema } from "mongoose";

const simulationSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    scenarioId: { type: String, required: true },
    symbol: { type: String, required: true },
    currentIndex: { type: Number, required: true, default: 0 },
    totalCandles: { type: Number, required: true, default: 0 },
    isPlaying: { type: Boolean, required: true, default: false },
    playSpeed: { type: Number, required: true, default: 1 },
    startDate: { type: String, required: false },
    endDate: { type: String, required: false },
  },
  { timestamps: true },
);

export type SimulationSessionDocument = InferSchemaType<typeof simulationSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SimulationSessionModel =
  mongoose.models.SimulationSession || mongoose.model("SimulationSession", simulationSessionSchema);
