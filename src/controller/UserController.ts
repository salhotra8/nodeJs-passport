import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { User } from "../entity/User";
import logger from "../utils/logger";
import { generateJwt } from "../config/passport";

export const userRepository = AppDataSource.getRepository(User);

export class UserController {
  async all(request: Request, response: Response, next: NextFunction) {
    return { data: userRepository.find() };
  }

  async one(request: Request, response: Response, next: NextFunction) {
    const id: any = parseInt(request.params.id);

    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return { status: 401, data: { message: "Unregistered user" } };
    }
    return { data: user };
  }

  async save(request: Request, response: Response, next: NextFunction) {
    const { firstName, lastName, age } = request.body;

    const user = Object.assign(new User(), {
      firstName,
      lastName,
      age,
    });

    return { data: userRepository.save(user) };
  }

  async remove(request: Request, response: Response) {
    const id: any = request.params.id;

    let userToRemove = await userRepository.findOneBy({ id });

    if (!userToRemove) {
      return "this user not exist";
    }

    await userRepository.remove(userToRemove);

    return { data: "user has been removed" };
  }

  public register = async (request: Request, response: Response) => {
    const { email, username, password } = request.body;

    if (!email || !username || !password) {
      return { status: 422, data: { message: "Missing fields data." } };
    }

    try {
      //check for duplicate user
      const duplicateUser = await userRepository.findOne({
        where: { username },
      });

      if (duplicateUser) {
        return { status: 409, data: { message: "User already exist." } };
      }

      const user = new User();
      user.email = email;
      user.username = username;
      await user.hashPassword(password);

      const { id } = await userRepository.save(user);

      var token = generateJwt({ id, username, email });

      return response.send({
        message: "User registered successfully",
        token: `Bearer ${token}`,
      });
    } catch (error) {
      logger.error(error);
      return { status: 500, data: { message: "Internal Server Error" } };
    }
  };

  public login = async (request: Request, response: Response) => {
    const { username } = request.body;

    try {
      const { id, email } = await userRepository.findOne({
        where: { username },
      });

      var token = generateJwt({ id, username, email });

      return response.send({
        message: "Login successful.",
        token: `Bearer ${token}`,
      });
    } catch (error) {
      logger.error(error);
      return { status: 500, data: { message: "Internal Server Error" } };
    }
  };
}
