import { Router } from "express";
import {createBlogUser} from "../services/userService";

const router = Router();

router.post('/api', createBlogUser)