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

// Enable CORS for all origins (for Postman and frontend access)
app.use(cors());

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/orgs', orgRouter);
app.use('/users', userRouter);
app.use('/groups', groupRouter);
app.use('/topics', topicRouter);
app.use('/preferences', prefRouter);



app.listen(PORT, ()=>{
    console.log("Server is listening on PORT: ", PORT);
})


