/**
 * API configuration utility
 * 
 * This file provides the base URL for API calls based on the current environment.
 * In development, it uses localhost:8000
 * In production, it uses the deployed Cloud Run URL
 */

// Determine if we're running in production based on the hostname
const isProduction = !window.location.hostname.includes('localhost');

// Set the API base URL based on the environment
export const API_BASE_URL = isProduction 
  ? 'https://hr-portal-mha4s7stfa-el.a.run.app' 
  : 'http://localhost:8000';

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
