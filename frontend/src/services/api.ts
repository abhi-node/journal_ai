// API Service - Main API client
import { API_CONFIG } from '../config/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Placeholder for API methods
  async get(endpoint: string) {
    // TODO: Implement GET request
  }

  async post(endpoint: string, data: any) {
    // TODO: Implement POST request
  }

  async put(endpoint: string, data: any) {
    // TODO: Implement PUT request
  }

  async delete(endpoint: string) {
    // TODO: Implement DELETE request
  }
}

export default new ApiService();