import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import apiRoutes from "./api/api-routes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Usa las rutas desde api-routes.js
app.use("/api", apiRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});