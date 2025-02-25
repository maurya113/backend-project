import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// the code in the app.js is - app.use("/users", userRouter) 
// now the control is passed to this and here we have defined the route as "/register"
// so the url will look like - http://localhost:8000/api/v1/users/register
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
//this is same as - app.post("/register", async(req, res, next) => {})
// so the async fn. is created in controller and directly passed here.

export default router;

