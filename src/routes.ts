import { UserController } from "./controller/UserController";
import * as passport from "passport";

export const Routes = [
  {
    method: "get",
    route: "/users",
    controller: UserController,
    action: "all",
  },
  {
    method: "get",
    route: "/users/:id",
    controller: UserController,
    action: "one",
  },
  {
    method: "post",
    route: "/users",
    controller: UserController,
    action: "save",
  },
  {
    method: "delete",
    route: "/users/:id",
    controller: UserController,
    action: "remove",
  },
  {
    method: "post",
    route: "/login",
    controller: UserController,
    action: "login",
    middleware: [passport.authenticate("local", { session: false })],
  },
  {
    method: "post",
    route: "/register",
    controller: UserController,
    action: "register",
  },
];
