import Queue from 'bull';
import { config } from '../config/config';
import { WorkflowEngine } from '../core/workflow-engine';

export class QueueService {
  private workflowQueue!: Queue.Queue;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.initializeQueues();
  }

  private initializeQueues() {
    this.workflowQueue = new Queue('workflow-execution', config.redis.url, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    });

    this.setupQueueHandlers();
  }

  private setupQueueHandlers() {
    this.workflowQueue.process(async (job) => {
      const { workflowId, data } = job.data;
      return await this.workflowEngine.executeWorkflow(workflowId, data);
    });

    this.workflowQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed for workflow ${job.data.workflowId}`);
    });

    this.workflowQueue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed for workflow ${job.data.workflowId}:`, error);
    });
  }

  async enqueueWorkflow(workflowId: string, data: Record<string, any> = {}) {
    return await this.workflowQueue.add({
      workflowId,
      data
    });
  }

  async getJobStatus(jobId: string) {
    const job = await this.workflowQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason
    };
  }

  async pauseQueue() {
    await this.workflowQueue.pause();
  }

  async resumeQueue() {
    await this.workflowQueue.resume();
  }

  async cleanQueue() {
    await this.workflowQueue.clean(1000, 'completed');
  }
}