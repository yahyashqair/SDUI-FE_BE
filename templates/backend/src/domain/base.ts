export class Entity {
  constructor(public id: string) {}
}

export interface Repository<T extends Entity> {
  save(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
}
