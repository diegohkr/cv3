import React from 'react';
import Sidebar from './Sidebar';
import ChatInterface from './ChatInterface';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-china-light">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Layout;
