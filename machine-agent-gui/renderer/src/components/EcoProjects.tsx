import React, { useState, useEffect } from 'react';

interface EcoProjectsProps {
  config: any;
}

interface Project {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  score: number;
}

export default function EcoProjects({ config }: EcoProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    // Load mock projects for demonstration
    loadMockProjects();
  }, []);

  const loadMockProjects = () => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Solar Panel Efficiency Dataset 2024',
        description: 'Comprehensive data on solar panel efficiency across different climates and conditions.',
        url: 'https://example.com/solar-efficiency',
        category: 'solar',
        score: 9.2
      },
      {
        id: '2',
        title: 'Wind Turbine Performance Metrics',
        description: 'Real-world wind turbine performance data from offshore installations.',
        url: 'https://example.com/wind-performance',
        category: 'wind',
        score: 8.7
      },
      {
        id: '3',
        title: 'EV Charging Infrastructure Map',
        description: 'Global database of EV charging stations with usage statistics.',
        url: 'https://example.com/ev-charging',
        category: 'ev',
        score: 8.9
      },
      {
        id: '4',
        title: 'Ocean Plastic Cleanup Progress',
        description: 'Tracking data for ocean cleanup initiatives worldwide.',
        url: 'https://example.com/ocean-cleanup',
        category: 'ocean',
        score: 9.5
      },
      {
        id: '5',
        title: 'Carbon Capture Technology Benchmarks',
        description: 'Performance benchmarks for various carbon capture technologies.',
        url: 'https://example.com/carbon-capture',
        category: 'carbon',
        score: 8.4
      },
      {
        id: '6',
        title: 'Renewable Energy Grid Integration',
        description: 'Data on renewable energy integration into national power grids.',
        url: 'https://example.com/grid-integration',
        category: 'energy',
        score: 8.8
      },
      {
        id: '7',
        title: 'Biodiversity Conservation Tracking',
        description: 'Wildlife population tracking data from conservation projects.',
        url: 'https://example.com/biodiversity',
        category: 'conservation',
        score: 9.1
      },
      {
        id: '8',
        title: 'Sustainable Agriculture Practices',
        description: 'Crop yield and sustainability metrics from organic farms.',
        url: 'https://example.com/sustainable-farming',
        category: 'agriculture',
        score: 8.6
      },
      {
        id: '9',
        title: 'Green Building Energy Consumption',
        description: 'Energy efficiency data from LEED-certified buildings.',
        url: 'https://example.com/green-buildings',
        category: 'buildings',
        score: 8.3
      },
      {
        id: '10',
        title: 'Climate Change Impact Models',
        description: 'Predictive models for climate change impacts on ecosystems.',
        url: 'https://example.com/climate-models',
        category: 'climate',
        score: 9.3
      }
    ];
    setProjects(mockProjects);
  };

  const handleScanForProjects = async () => {
    setIsScanning(true);
    setMessage({ type: 'info', text: '🔍 Scanning for eco projects...' });

    // Simulate scanning delay
    setTimeout(() => {
      loadMockProjects();
      setIsScanning(false);
      setMessage({ type: 'success', text: `✅ Found ${10} new eco projects!` });
    }, 2000);
  };

  const handleApproveProject = async (project: Project) => {
    if (!config) {
      setMessage({ type: 'error', text: 'Configuration required' });
      return;
    }

    setMessage({ type: 'info', text: `Approving project: ${project.title}...` });

    // Here you would insert the project into a Supabase table
    // For now, just simulate success
    setTimeout(() => {
      setMessage({ type: 'success', text: `✅ Project approved and added to database!` });
      setProjects(prev => prev.filter(p => p.id !== project.id));
    }, 1000);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>Eco Projects Scanner</h1>

      {message && (
        <div className={`alert ${message.type}`} style={{ marginBottom: '24px' }}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Scan Configuration</h2>
        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>
          This scanner finds trending open data projects related to:
          solar, wind, EVs, ocean cleanup, carbon capture, and other sustainability initiatives.
        </p>
        <button 
          className="primary" 
          onClick={handleScanForProjects}
          disabled={isScanning}
        >
          {isScanning ? '🔄 Scanning...' : '🔍 Scan for Projects'}
        </button>
      </div>

      <div className="card">
        <h2>Discovered Projects ({projects.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projects.map(project => (
            <div 
              key={project.id}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', margin: 0 }}>{project.title}</h3>
                  <span 
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {project.category}
                  </span>
                  <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>
                    Score: {project.score}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
                  {project.description}
                </p>
                <a 
                  href={project.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}
                >
                  🔗 {project.url}
                </a>
              </div>
              <button 
                className="primary"
                onClick={() => handleApproveProject(project)}
                style={{ marginLeft: '16px', flexShrink: 0 }}
              >
                ✓ Approve
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
              No projects found. Click "Scan for Projects" to discover new eco data sources.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
