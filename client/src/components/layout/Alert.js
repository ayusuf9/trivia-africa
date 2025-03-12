import React from 'react';
import { useSelector } from 'react-redux';

const Alert = () => {
  const alerts = useSelector(state => state.alert);

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-5 z-50 max-w-md">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`mb-4 p-4 rounded-lg shadow-md transition-all duration-300 transform translate-x-0 
            ${
              alert.type === 'success'
                ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
                : alert.type === 'error'
                ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
                : alert.type === 'warning'
                ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
                : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
            }`}
        >
          {alert.msg}
        </div>
      ))}
    </div>
  );
};

export default Alert; 