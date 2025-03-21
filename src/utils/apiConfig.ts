/**
 * API configuration utility
 * 
 * This file provides the base URL for API calls based on the current environment.
 * In development, it uses localhost:5000
 * In production, it uses localhost:8000
 */

// Determine if we're running in production (in Docker) or development
const isProduction = window.location.port === '8000';

// Set the API base URL based on the environment
export const API_BASE_URL = isProduction ? 'http://localhost:8000' : 'http://localhost:5000';

/**
 * Creates a full API URL by appending the endpoint to the base URL
 * @param endpoint - The API endpoint (should start with /)
 * @returns The complete API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // Make sure the endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

/**
 * Default headers for API requests
 */
export const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authentication token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
