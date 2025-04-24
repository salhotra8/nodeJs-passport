import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { userRepository } from "../controller/UserController";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import * as jwt from "jsonwebtoken";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
};

passport.use(
  new LocalStrategy(async (username: string, password: string, done: any) => {
    try {
      const user = await userRepository.findOneBy({ username });
      
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload: any, done: any) => {
    try {
      const user = await userRepository.findOneBy({ id: jwtPayload.id });
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  }),
);

export function generateJwt(user: any): string {
  const payload = {
    id: user.id,
    username: user.username,
  };
  
  return jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: "2h" });
}
