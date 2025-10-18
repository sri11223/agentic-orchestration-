import { Request, Response } from 'express';
import { WorkflowModel } from '../models/workflow.model';

export const workflowController = {
  // Get all workflows
  getAllWorkflows: async (req: Request, res: Response) => {
    try {
      const workflows = await WorkflowModel.find();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching workflows', error });
    }
  },

  // Get workflow by ID
  getWorkflowById: async (req: Request, res: Response) => {
    try {
      const workflow = await WorkflowModel.findById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching workflow', error });
    }
  },

  // Create new workflow
  createWorkflow: async (req: Request, res: Response) => {
    try {
      const workflow = new WorkflowModel({
        ...req.body,
        createdBy: req.body.userId || 'system', // Replace with actual user ID from auth
      });
      await workflow.save();
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Error creating workflow', error });
    }
  },

  // Update workflow
  updateWorkflow: async (req: Request, res: Response) => {
    try {
      const workflow = await WorkflowModel.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Error updating workflow', error });
    }
  },

  // Delete workflow
  deleteWorkflow: async (req: Request, res: Response) => {
    try {
      const workflow = await WorkflowModel.findByIdAndDelete(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found' });
      }
      res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting workflow', error });
    }
  }
};