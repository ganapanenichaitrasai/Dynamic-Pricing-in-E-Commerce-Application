import React, { useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar"; // Import the Sidebar component
import "./Sidebar.css";
import "./DynamicPricing.css"; // Import the new CSS file

const DynamicPricing = () => {
  const [file, setFile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyticsGenerated, setAnalyticsGenerated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setAnalyticsGenerated(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("❌ Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.predictions) {
        setPredictions(response.data.predictions);
        
        // Store analytics data for the Analytics component
        if (response.data.analytics) {
          localStorage.setItem("latestAnalytics", JSON.stringify(response.data.analytics));
          setAnalyticsGenerated(true);
        }
      } else {
        setError("⚠️ Unexpected response from server.");
      }
    } catch (error) {
      setError("❌ Error uploading file. Please try again.");
      console.error("Upload Error:", error);
    } finally {
      setLoading(false);
    }
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
        {/* Header with Welcome Text and Profile Settings */}
        <div className="header">
          <h1>Dynamic Pricing</h1>
        </div>

        {/* Dynamic Pricing Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold">Upload dataset file to get dynamic prices</h2>
          
          <div className="flex items-center space-x-4 mt-4">
            <input 
              type="file" 
              onChange={handleFileChange}
              className="border p-2 rounded"
              accept=".csv"
            />
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Processing..." : "Upload & Train"}
            </button>
          </div>

          {loading && <p className="mt-4 text-blue-600">🔄 Model is training... Please wait.</p>}
          {error && <p className="text-red-600 mt-4">{error}</p>}
          
          {analyticsGenerated && (
            <div className="mt-4 bg-green-100 p-4 rounded">
              <p className="text-green-700">
                ✅ Analytics data generated successfully! Visit the Analytics dashboard to view insights.
              </p>
              <a 
                href="/analytics" 
                className="text-blue-600 underline hover:text-blue-800 mt-2 inline-block"
              >
                Go to Analytics Dashboard →
              </a>
            </div>
          )}

          {predictions.length > 0 && (
            <div className="table-container"> {/* Add the table-container class here */}
              <h3 className="text-lg font-semibold">Predicted Prices:</h3>
              <div className="overflow-x-auto mt-2">
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Brand</th>
                      <th>Predicted Price ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.brand}</td>
                        <td className="text-right">
                          {typeof item.predicted_price === "number" ? item.predicted_price.toFixed(2) : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicPricing;