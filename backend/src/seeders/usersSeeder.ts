import bcrypt from "bcrypt";
import { UserModel } from "../models/User";

export async function seedUsers(): Promise<{ userId: string }> {
  const email = "demo@test.com";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        passwordHash,
        name: "Demo Trader",
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return { userId: String(user._id) };
}
