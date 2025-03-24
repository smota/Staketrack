import { configService } from './configService.js';
import { EventBus } from '../utils/eventBus.js';

class StakeholderService {
  constructor() {
    this.stakeholders = this.loadStakeholders();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await configService.initialize();
      this.initialized = true;
    } catch (error) {
      console.warn('Stakeholder service initialization failed:', error);
    }
  }

  loadStakeholders() {
    try {
      return JSON.parse(localStorage.getItem('stakeholders') || '[]');
    } catch (error) {
      console.warn('Failed to load stakeholders from localStorage:', error);
      return [];
    }
  }

  saveStakeholders() {
    try {
      localStorage.setItem('stakeholders', JSON.stringify(this.stakeholders));
    } catch (error) {
      console.warn('Failed to save stakeholders to localStorage:', error);
    }
  }

  async addStakeholder(stakeholder) {
    try {
      const newStakeholder = {
        ...stakeholder,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      this.stakeholders.push(newStakeholder);
      this.saveStakeholders();

      // Emit event for UI update
      EventBus.emit('stakeholder:added', newStakeholder);

      return newStakeholder;
    } catch (error) {
      console.error('Failed to add stakeholder:', error);
      throw error;
    }
  }

  async updateStakeholder(id, updates) {
    try {
      const index = this.stakeholders.findIndex(s => s.id === id);
      if (index === -1) {
        throw new Error('Stakeholder not found');
      }

      this.stakeholders[index] = {
        ...this.stakeholders[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveStakeholders();
      EventBus.emit('stakeholder:updated', this.stakeholders[index]);

      return this.stakeholders[index];
    } catch (error) {
      console.error('Failed to update stakeholder:', error);
      throw error;
    }
  }

  async deleteStakeholder(id) {
    try {
      const index = this.stakeholders.findIndex(s => s.id === id);
      if (index === -1) {
        throw new Error('Stakeholder not found');
      }

      const deletedStakeholder = this.stakeholders.splice(index, 1)[0];
      this.saveStakeholders();
      EventBus.emit('stakeholder:deleted', deletedStakeholder);

      return deletedStakeholder;
    } catch (error) {
      console.error('Failed to delete stakeholder:', error);
      throw error;
    }
  }

  getStakeholder(id) {
    return this.stakeholders.find(s => s.id === id);
  }

  getAllStakeholders() {
    return [...this.stakeholders];
  }
}

export const stakeholderService = new StakeholderService(); 