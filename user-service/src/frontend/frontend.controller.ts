import { Controller, Get, Res } from "@nestjs/common";
import express from "express";
import { join } from "path";

@Controller()
export class FrontendController {

    @Get('/')
    getLandingPage(@Res() res: express.Response) {
        res.sendFile(join(process.cwd(), 'src/frontend/public/index.html'))
    }
}