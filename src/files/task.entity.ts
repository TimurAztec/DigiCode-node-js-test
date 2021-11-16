import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity('task')
export class Task {
  @ObjectIdColumn()
  id: ObjectID;
  @Column({type: 'text'})
  eventType: string;
  @Column({type: 'text'})
  path: string;
  @Column({type: 'text'})
  text: string;
  @Column({type: 'text'})
  name: string;
  @Column({type: 'text'})
  size: number;
  @Column()
  created_at: Date;
  @Column()
  updated_at: Date;
}
