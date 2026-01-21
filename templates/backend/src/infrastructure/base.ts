// Database adapters, API routes (The only place external libraries exist)
import { Repository, Entity } from '../domain/base';

export class InMemoryRepository<T extends Entity> implements Repository<T> {
  private items: Map<string, T> = new Map();

  async save(entity: T): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }
}
