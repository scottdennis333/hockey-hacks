import React from 'react';
import { API_BASE_URL } from './api';

const ApiDebugInfo = () => {
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  const currentProtocol = window.location.protocol;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div><strong>🔗 API Debug Info</strong></div>
      <div>Client URL: {`${currentProtocol}//${currentHost}:${currentPort}`}</div>
      <div>API URL: {API_BASE_URL}</div>
      <div>Host: {currentHost}</div>
      <div>Detection: {process.env.REACT_APP_API_URL ? 'Environment Variable' : 'Dynamic'}</div>
    </div>
  );
};

export default ApiDebugInfo;
