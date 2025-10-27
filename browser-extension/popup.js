// Anonymous extension - no authentication required
const API_URL = 'https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1';

// Get current tab domain
async function getCurrentDomain() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  
  try {
    const url = new URL(tab.url);
    return url.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

// Fetch company data for current domain
async function fetchCompanyData(domain) {
  try {
    const response = await fetch(`${API_URL}/extension-company-data?domain=${encodeURIComponent(domain)}`);
    const data = await response.json();
    return data.company;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
}

// Track anonymous visit
async function trackVisit(domain, companyId = null) {
  try {
    await fetch(`${API_URL}/extension-track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        company_id: companyId,
        anonymous: true
      })
    });
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
}

// Get sustainability score class
function getScoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}

// Render company data
function renderCompanyData(company) {
  const content = document.getElementById('content');
  
  if (!company) {
    content.innerHTML = `
      <div class="no-data">
        <h3>🌱 No carbon data available</h3>
        <p>We don't have carbon emissions data for this website yet.</p>
        <p style="margin-top: 16px; font-size: 12px;">Help us expand our database by visiting more sites!</p>
      </div>
    `;
    return;
  }

  const co2Tons = company.annual_co2_tons || 0;
  const score = company.sustainability_score || 0;
  const scoreClass = getScoreClass(score);

  content.innerHTML = `
    <div class="company-section">
      <div class="company-name">${company.company_name}</div>
      <div class="co2-amount">${formatNumber(co2Tons)} tons CO₂/year</div>
      <div class="sustainability-score ${scoreClass}">
        Sustainability Score: ${score}/100
      </div>
      
      ${company.scope_1_emissions || company.scope_2_emissions || company.scope_3_emissions ? `
        <div style="margin-top: 16px;">
          ${company.scope_1_emissions ? `
            <div class="stat-row">
              <span class="stat-label">Scope 1 (Direct)</span>
              <span class="stat-value">${formatNumber(company.scope_1_emissions)} tons</span>
            </div>
          ` : ''}
          ${company.scope_2_emissions ? `
            <div class="stat-row">
              <span class="stat-label">Scope 2 (Energy)</span>
              <span class="stat-value">${formatNumber(company.scope_2_emissions)} tons</span>
            </div>
          ` : ''}
          ${company.scope_3_emissions ? `
            <div class="stat-row">
              <span class="stat-label">Scope 3 (Indirect)</span>
              <span class="stat-value">${formatNumber(company.scope_3_emissions)} tons</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${company.last_report_date ? `
        <div style="margin-top: 12px; text-align: center; font-size: 11px; color: #86efac;">
          Last reported: ${new Date(company.last_report_date).toLocaleDateString()}
        </div>
      ` : ''}
    </div>
    
    <div class="stats-summary">
      <div class="stats-title">🌍 You're helping raise awareness!</div>
      <p style="font-size: 12px; margin: 8px 0 0 0;">
        By using this extension, you're contributing to a global database of corporate carbon emissions.
      </p>
    </div>
  `;
}

// Download data feature
document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const { visitedDomains = [] } = await chrome.storage.local.get('visitedDomains');
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Domain,Visited At,Duration (seconds)\n' +
      visitedDomains.map(v => `${v.domain},${v.timestamp},${v.duration || 0}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dataforearth_carbon_tracking_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Your carbon tracking data has been downloaded!');
  } catch (error) {
    console.error('Error downloading data:', error);
    alert('Failed to download data. Please try again.');
  }
});

// Initialize
(async () => {
  const domain = await getCurrentDomain();
  
  if (!domain) {
    document.getElementById('content').innerHTML = `
      <div class="no-data">
        <p>Unable to detect domain</p>
      </div>
    `;
    return;
  }

  const company = await fetchCompanyData(domain);
  renderCompanyData(company);
  
  // Track visit anonymously
  if (company) {
    await trackVisit(domain, company.id);
  } else {
    await trackVisit(domain, null);
  }
  
  // Store visit locally for download feature
  const { visitedDomains = [] } = await chrome.storage.local.get('visitedDomains');
  visitedDomains.push({
    domain,
    timestamp: new Date().toISOString(),
    company: company?.company_name || 'Unknown'
  });
  
  // Keep only last 1000 visits
  if (visitedDomains.length > 1000) {
    visitedDomains.shift();
  }
  
  await chrome.storage.local.set({ visitedDomains });
})();
