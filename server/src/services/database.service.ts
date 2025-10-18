import mongoose from 'mongoose';
import { WorkflowModel } from '../models/workflow.model';
import { WorkflowExecutionModel } from '../models/workflow-execution.model';

export class DatabaseService {
  private dynamicModels = new Map<string, mongoose.Model<any>>();

  async saveExecutionRecord(data: any) {
    const rec = new WorkflowExecutionModel(data);
    await rec.save();
    return rec;
  }

  async updateExecutionRecord(id: string, patch: any) {
    return WorkflowExecutionModel.findByIdAndUpdate(id, patch, { new: true });
  }

  // Get or create a dynamic model for arbitrary collections
  private getDynamicModel(modelName: string): mongoose.Model<any> {
    if (this.dynamicModels.has(modelName)) {
      return this.dynamicModels.get(modelName)!;
    }

    // Create a flexible schema for dynamic collections
    const dynamicSchema = new mongoose.Schema({}, { 
      strict: false,  // Allow any fields
      timestamps: true // Add createdAt/updatedAt automatically
    });

    const model = mongoose.model(modelName, dynamicSchema);
    this.dynamicModels.set(modelName, model);
    return model;
  }

  // Generic helper to save arbitrary collections via model lookup
  async insertToCollection(modelName: string, doc: any) {
    // Support predefined models
    if (modelName === 'executions') return this.saveExecutionRecord(doc);
    if (modelName === 'workflows') return WorkflowModel.create(doc);
    
    // Support dynamic collections
    const Model = this.getDynamicModel(modelName);
    return Model.create(doc);
  }
}
