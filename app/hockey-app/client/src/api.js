// API configuration utility
const getApiUrl = () => {
  // Check if we have a custom API URL from environment variables
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 Using configured API URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // For network access, try to detect the current host
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // If accessing via IP address or custom domain, use that with port 5000
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const apiUrl = `${protocol}//${hostname}:5000`;
    console.log('🌐 Dynamic API URL detected:', apiUrl, `(hostname: ${hostname})`);
    return apiUrl;
  }

  // Default to localhost for local development
  const localUrl = `${protocol}//localhost:5000`;
  console.log('🏠 Using localhost API URL:', localUrl);
  return localUrl;
};

export const API_BASE_URL = getApiUrl();

// Helper function for making API calls
export const apiCall = async (endpoint) => {
  const url = endpoint.startsWith('/') ? `${API_BASE_URL}${endpoint}` : `${API_BASE_URL}/${endpoint}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
