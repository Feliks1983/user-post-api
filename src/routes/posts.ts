import { Router } from "express";
import {createBlogPost} from "../services/postService";

const router = Router();

router.post('/api', createBlogPost);

