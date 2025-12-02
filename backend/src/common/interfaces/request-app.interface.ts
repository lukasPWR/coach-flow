import { Request } from "express";
import { AuthUserInterface } from "./auth-user.interface";

/**
 * Request extending interface with a logged-in user data
 */
export interface IRequestApp extends Request {
  user: AuthUserInterface;
}
