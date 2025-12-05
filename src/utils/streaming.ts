import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ?? 3001,
  OPENAI_KEY: process.env.OPENAI_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL!,
  DATA_PATH: process.cwd() + "/data"
};
