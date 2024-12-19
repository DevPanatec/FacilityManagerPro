import { dataHubService } from '../../services/dataHubService';

export const organizationsController = {
  async getAll(req, res) {
    try {
      const data = await dataHubService.getDataHubSummary();
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error al obtener organizaciones',
        details: error.message 
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await dataHubService.getOrganizationById(id);
      if (!data) {
        return res.status(404).json({ error: 'Organización no encontrada' });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ 
        error: 'Error al obtener la organización',
        details: error.message 
      });
    }
  },

  async create(req, res) {
    try {
      const orgData = req.body;
      const result = await dataHubService.createOrganization(orgData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error al crear la organización',
        details: error.message 
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const orgData = req.body;
      const result = await dataHubService.updateOrganization(id, orgData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        error: 'Error al actualizar la organización',
        details: error.message 
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await dataHubService.deleteOrganization(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ 
        error: 'Error al eliminar la organización',
        details: error.message 
      });
    }
  }
}; 