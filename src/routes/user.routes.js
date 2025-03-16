import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
/* verifyJWT method adds the user to the req.user and now we have access to the user through req.user inside logoutUser method. */ 

// we can add as many middlewares as we want

router.route("/refresh-token").post(refreshAccessToken)





export default router;

