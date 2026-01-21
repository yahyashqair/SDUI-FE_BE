// Use Cases, Commands, Queries
export interface UseCase<I, O> {
  execute(input: I): Promise<O>;
}
