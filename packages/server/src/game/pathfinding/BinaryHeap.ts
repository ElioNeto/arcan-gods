/**
 * Min-heap data structure for priority queue operations.
 * Items are compared by their numeric `.score` property.
 * Provides O(log n) push/pop and O(1) peek.
 */
export class BinaryHeap<T extends { score: number }> {
  private items: T[] = [];

  /**
   * Pushes an item onto the heap.
   * O(log n)
   */
  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  /**
   * Removes and returns the smallest item (by score).
   * Returns undefined if the heap is empty.
   * O(log n)
   */
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const bottom = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  /**
   * Returns the smallest item without removing it.
   * Returns undefined if the heap is empty.
   * O(1)
   */
  peek(): T | undefined {
    return this.items[0];
  }

  /**
   * Returns the number of items in the heap.
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Removes all items from the heap.
   */
  clear(): void {
    this.items = [];
  }

  /* ---- internal helpers ---- */

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = ((index - 1) >> 1);
      if (this.items[index].score >= this.items[parent].score) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  private sinkDown(index: number): void {
    const length = this.items.length;
    while (true) {
      let smallest = index;
      const left = (index << 1) + 1;
      const right = left + 1;

      if (left < length && this.items[left].score < this.items[smallest].score) {
        smallest = left;
      }
      if (right < length && this.items[right].score < this.items[smallest].score) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}
