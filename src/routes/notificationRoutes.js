import { Router } from 'express';
import { fetchProtectedResource } from '../services/evaluationApi.js';

export const notificationRouter = Router();

const typePriority = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

class MinHeap {
  constructor(capacity) {
    this.heap = [];
    this.capacity = capacity;
  }

  isLess(a, b) {
    const pA = typePriority[a.Type] || 0;
    const pB = typePriority[b.Type] || 0;
    if (pA !== pB) return pA < pB;
    return new Date(a.Timestamp) < new Date(b.Timestamp);
  }

  insert(node) {
    if (this.heap.length < this.capacity) {
      this.heap.push(node);
      this.bubbleUp(this.heap.length - 1);
    } else {
      if (this.isLess(this.heap[0], node)) {
        this.heap[0] = node;
        this.bubbleDown(0);
      }
    }
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.isLess(this.heap[index], this.heap[parentIndex])) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parentIndex];
        this.heap[parentIndex] = temp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      let leftChild = 2 * index + 1;
      let rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.isLess(this.heap[leftChild], this.heap[smallest])) {
        smallest = leftChild;
      }
      if (rightChild < length && this.isLess(this.heap[rightChild], this.heap[smallest])) {
        smallest = rightChild;
      }
      if (smallest !== index) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }

  getSorted() {
    return [...this.heap].sort((a, b) => this.isLess(a, b) ? 1 : -1);
  }
}

notificationRouter.get('/', async (req, res, next) => {
  try {
    const token = process.env.EVALUATION_BEARER_TOKEN;

    if (!token) {
      return res.status(400).json({ message: 'Missing evaluation token' });
    }

    const rawData = await fetchProtectedResource('/notifications', token);
    const notifications = rawData.notifications || [];

    const heap = new MinHeap(10);
    for (const notif of notifications) {
      heap.insert(notif);
    }

    const top10 = heap.getSorted();

    res.json({
      originalCount: notifications.length,
      top10
    });
  } catch (error) {
    next(error);
  }
});
