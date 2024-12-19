import { dataHubService } from '@/services/dataHubService';

export const getOrganizations = async () => {
  const data = await dataHubService.getDataHubSummary();
  return data.organizations;
};

export const createOrganization = async (orgData: any) => {
  return await dataHubService.createOrganization(orgData);
}; 