import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import userRouter from "./routes/user";
import topicRouter from "./routes/topics";
import groupRouter from "./routes/group";
import prefRouter from "./routes/preference";
import orgRouter from "./routes/org";

dotenv.config()

const PORT = process.env.PORT || 3000;
const app = express();


app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "x-user-id"]
}));

app.use(express.json())
app.use(express.urlencoded({extended: true}))


app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use('/orgs', orgRouter);
app.use('/users', userRouter);
app.use('/groups', groupRouter);
app.use('/topics', topicRouter);
app.use('/preferences', prefRouter);



app.listen(PORT, ()=>{
    console.log("Server is listening on PORT: ", PORT);
})


