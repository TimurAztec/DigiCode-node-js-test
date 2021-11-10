import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity()
export class User {
  @ObjectIdColumn()
  id: ObjectID;
  @Column({type: 'text'})
  email: string;
  @Column({type: 'text'})
  password: string;
}
