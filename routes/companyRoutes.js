import express from "express"
import { registerCompany, getCompany, getCompanyById, updateCompany } from "../controllers/companyController.js"
import isAuthenticated from "../middleware/isAuthenticated.js"
import { singleUpload } from "../middleware/multer.js"

const router = express.Router()

router.post("/register", isAuthenticated, registerCompany)
router.get("/get", isAuthenticated, getCompany)
router.get("/get/:id", isAuthenticated, getCompanyById)
router.patch("/update/:id", isAuthenticated, singleUpload, updateCompany)


export default router 