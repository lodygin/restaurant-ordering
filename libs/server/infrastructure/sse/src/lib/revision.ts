export class Revision {
  // boot time, so a revision from before a restart never matches a new one
  private value = Date.now();

  current(): number {
    return this.value;
  }

  next(): number {
    this.value += 1;

    return this.value;
  }
}
