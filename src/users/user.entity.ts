import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity('user')
export class User {
  @ObjectIdColumn()
  id: ObjectID;
  @Column({type: 'text'})
  email: string;
  @Column({type: 'text'})
  password: string;
}
