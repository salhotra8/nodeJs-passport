// import * as dotenv from "dotenv";

// dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

import { AppDataSource } from "./data-source";
import * as express from "express";
import { NextFunction, Request, Response } from "express";
import { Routes } from "./routes";
import logger from "./utils/logger";
import * as passport from "passport";
import { DataSource } from "typeorm";


AppDataSource.initialize()
  .then(async (dataSource: DataSource) => {
    // create express app
    const app = express();

    //parse req body
    app.use(express.json());

    //initialise passport
    app.use(passport.initialize());

    // register express routes from defined application routes
    Routes.forEach(({ method, route, controller, action, middleware = [] }) => {
      app[method](
        route,
        ...middleware,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const controllerInstance = new controller();
            const result = await controllerInstance[action](req, res, next);

            // Centralized response handling
            if (result) {
              const status = result.status || 200;
              res.status(status).json(result.data);
            }
          } catch (err) {
            next(err); // Delegate to error handler middleware
          }
        },
      );
    });

    const port = process.env.PORT || 8000;

    // start express server
    app.listen(port, () => {
      logger.info(
        `Server is running on http://localhost:${port}\nConnected to the Database - ${dataSource.options.database}`,
      );
    });
  })
  .catch((error) => logger.error(error));
