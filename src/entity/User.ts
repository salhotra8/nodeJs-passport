import { UUID } from "crypto";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import * as bcrypt from 'bcrypt'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: UUID;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  username: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: false,
  })
  password?: string;

  @Column({
    type: "varchar",
    length: 80,
    nullable: true,
  })
  email?: string

  async comparePassword(attemptedPassword: string): Promise<boolean> {
    return bcrypt.compare(attemptedPassword, this.password || '');
  }

  async hashPassword(password: string): Promise<void> {
    this.password = await bcrypt.hash(password, 10);
  }
}


