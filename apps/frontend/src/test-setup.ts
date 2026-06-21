import "@testing-library/jest-dom";
import path from "path";
import dotenv from "dotenv";
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });
