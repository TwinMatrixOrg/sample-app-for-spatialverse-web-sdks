/**
 * App Component
 * 
 * Root component for the sample application.
 * Wraps the DashboardLayout with any necessary providers.
 * 
 * This demonstrates the minimal app structure needed to use the SDKs.
 */

import React from 'react';
import DashboardLayout from './features/dashboard/DashboardLayout';

const App: React.FC = () => {
  return <DashboardLayout />;
};

export default App;
