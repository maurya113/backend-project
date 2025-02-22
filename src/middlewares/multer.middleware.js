import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, Date.now() + '-' +file.originalname)
      //this is not a good practise as a user may upload more than one file with the same name.
    }
  })
  
export const upload = multer({ storage: storage })