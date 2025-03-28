import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar"; // Import the Sidebar component
import "./Sidebar.css"; // Import the Sidebar CSS
import "./Analytics.css"; // Import the Analytics-specific CSS

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar

  // This function can be called when new data is processed
  // or when the component mounts if you want to retrieve existing analytics
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError("");
    
    try {
      // For now, we'll use the most recent analytics data
      // In a real app, you might want to fetch this from a separate endpoint
      const storedAnalytics = localStorage.getItem("latestAnalytics");
      
      if (storedAnalytics) {
        setAnalyticsData(JSON.parse(storedAnalytics));
      } else {
        setError("No analytics data available. Please upload a file first.");
      }
    } catch (error) {
      setError("Error fetching analytics data");
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Function to render metrics
  const renderMetrics = () => {
    if (!analyticsData || !analyticsData.metrics) return null;
    
    return (
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold mb-2">Model Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(analyticsData.metrics).map(([key, value]) => (
            <div key={key} className="border p-3 rounded">
              <p className="text-sm text-gray-500">{formatMetricName(key)}</p>
              <p className="text-lg font-bold">{value.toFixed(4)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to format metric names
  const formatMetricName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Function to render feature importance
  const renderFeatureImportance = () => {
    if (!analyticsData || !analyticsData.feature_importance) return null;
    
    const { features, importance } = analyticsData.feature_importance;
    
    return (
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold mb-2">Feature Importance</h3>
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={feature} className="relative">
              <div className="flex items-center mb-1">
                <span className="w-32 text-sm">{feature}</span>
                <span className="ml-2 text-sm font-semibold">{importance[index].toFixed(4)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.abs(importance[index] / Math.max(...importance.map(Math.abs)) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render graphs
  const renderGraphs = () => {
    if (!analyticsData || !analyticsData.graphs) return null;
    
    const { graphs } = analyticsData;
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Model Visualization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(graphs).map(([key, base64Image]) => (
            <div key={key} className="bg-white p-4 rounded shadow-md">
              <h4 className="font-medium mb-2">{formatMetricName(key)}</h4>
              <img 
                src={`data:image/png;base64,${base64Image}`} 
                alt={`${key} graph`} 
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render correlation matrix
  const renderCorrelationMatrix = () => {
    if (!analyticsData || !analyticsData.correlation_matrix_data) return null;
    
    return (
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold mb-2">Correlation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 bg-gray-100"></th>
                {Object.keys(analyticsData.correlation_matrix_data).map(key => (
                  <th key={key} className="border border-gray-300 px-4 py-2 bg-gray-100">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(analyticsData.correlation_matrix_data).map(([rowKey, rowData]) => (
                <tr key={rowKey}>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-normal text-left">{rowKey}</th>
                  {Object.entries(rowData).map(([colKey, value]) => (
                    <td 
                      key={`${rowKey}-${colKey}`} 
                      className="border border-gray-300 px-4 py-2 text-center"
                      style={{
                        backgroundColor: `rgba(${value < 0 ? '255,0,0,' : '0,0,255,'} ${Math.abs(value) * 0.5})`
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        handleLogout={() => {}} // Add logout functionality if needed
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="p-6 bg-gray-50 min-h-screen">
          <h2 className="text-2xl font-bold mb-6">Price Prediction Analytics</h2>
          
          {loading && <p className="text-blue-600">🔄 Loading analytics data...</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          
          {analyticsData && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderMetrics()}
                {renderFeatureImportance()}
              </div>
              
              {renderCorrelationMatrix()}
              
              {renderGraphs()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;