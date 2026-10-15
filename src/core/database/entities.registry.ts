export const registeredEntities: Function[] = [];

export function registerEntities(entities: Function[]): void {
  for (const entity of entities) {
    if (!registeredEntities.includes(entity)) {
      registeredEntities.push(entity);
    }
  }
}
