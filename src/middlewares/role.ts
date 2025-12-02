import  { Role } from "@prisma/client";
import  { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export const requireRole = (requiredRole: Role) => async(req: Request, res: Response, next: NextFunction) =>{
    try {
        // Check userId from body or headers (not params - params may have different names like orgId)
        const userId = req.body?.userId || req.headers['x-user-id'] as string;

        if(!userId){
            return res.status(401).json({
                success: false,
                message: "Authentication required: User ID is missing"
            })
        }

        const user = await prisma.user.findFirst({where: {id: userId}})

        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if (user.role !== requiredRole){
            return res.status(403).json({
                success: false,
                message: "Forbidden: Insufficient permissions"
            })
        }

        next()
    }
    catch(error){
        console.log("Error in requireRole: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server error"
        })
    }
}