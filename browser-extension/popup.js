// Configuration
const API_URL = 'https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1';
const WEBSITE_URL = 'https://492e7fd1-6e30-483a-bddd-e3199d936946.lovableproject.com';

// Get user authentication state
async function checkAuth() {
  const token = await chrome.storage.local.get(['authToken']);
  return token.authToken || null;
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Format CO2 emissions
function formatCO2(tons) {
  if (tons >= 1000000) return (tons / 1000000).toFixed(1) + 'M tons';
  if (tons >= 1000) return (tons / 1000).toFixed(0) + 'K tons';
  return tons.toFixed(0) + ' tons';
}

// Get badge data
function getBadgeData(tier) {
  const badges = {
    bronze: { icon: '🥉', name: 'Bronze Tracker' },
    silver: { icon: '🥈', name: 'Silver Guardian' },
    gold: { icon: '🥇', name: 'Gold Champion' },
    platinum: { icon: '💎', name: 'Platinum Hero' }
  };
  return badges[tier] || badges.bronze;
}

// Extract domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Load current tab company data
async function loadCurrentCompany() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;

  const domain = getDomain(tab.url);
  if (!domain) return null;

  try {
    const response = await fetch(`${API_URL}/extension-company-data?domain=${domain}`);
    const data = await response.json();
    return data.company || null;
  } catch (error) {
    console.error('Error loading company:', error);
    return null;
  }
}

// Load user stats
async function loadUserStats() {
  const token = await checkAuth();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/extension-user-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading user stats:', error);
    return null;
  }
}

// Track current site visit
async function trackVisit(domain, companyId) {
  const token = await checkAuth();
  if (!token) return;

  try {
    await fetch(`${API_URL}/extension-track-visit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ domain, company_id: companyId })
    });
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
}

// Update UI with company data
function updateCompanyUI(company) {
  if (!company) {
    document.getElementById('companyCard').style.display = 'none';
    return;
  }

  document.getElementById('companyCard').style.display = 'block';
  document.getElementById('companyName').textContent = company.company_name;
  document.getElementById('annualCO2').textContent = formatCO2(company.annual_co2_tons);
  
  const scope12 = (company.scope_1_emissions || 0) + (company.scope_2_emissions || 0);
  document.getElementById('scope12').textContent = formatCO2(scope12);
  
  document.getElementById('scoreValue').textContent = company.sustainability_score + '/100';
  document.getElementById('scoreFill').style.width = company.sustainability_score + '%';
}

// Update UI with user stats
function updateStatsUI(stats) {
  if (!stats) return;

  document.getElementById('totalImpact').textContent = formatNumber(stats.total_co2_awareness || 0);
  document.getElementById('sitesTracked').textContent = formatNumber(stats.total_sites_tracked || 0);
  document.getElementById('pointsEarned').textContent = formatNumber(stats.points || 0);
  document.getElementById('challengesCompleted').textContent = stats.challenges_completed || 0;

  const badge = getBadgeData(stats.badge_tier || 'bronze');
  document.getElementById('badgeIcon').textContent = badge.icon;
  document.getElementById('badgeTier').textContent = badge.name;
}

// Initialize popup
async function init() {
  const loading = document.getElementById('loading');
  const notLoggedIn = document.getElementById('not-logged-in');
  const mainContent = document.getElementById('main-content');

  const token = await checkAuth();

  if (!token) {
    loading.style.display = 'none';
    notLoggedIn.style.display = 'block';
    return;
  }

  // Load data
  const [company, stats] = await Promise.all([
    loadCurrentCompany(),
    loadUserStats()
  ]);

  // Track this visit
  if (company) {
    trackVisit(company.domain, company.id);
  }

  // Update UI
  updateCompanyUI(company);
  updateStatsUI(stats);

  loading.style.display = 'none';
  mainContent.style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('loginBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEBSITE_URL}/login` });
  });

  document.getElementById('viewDashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEBSITE_URL}/profile` });
  });

  document.getElementById('shareCO2')?.addEventListener('click', async () => {
    const stats = await loadUserStats();
    const text = `I've tracked ${formatNumber(stats?.total_co2_awareness || 0)} tons of CO₂ emissions with @DataForEarth! Join me in tracking company carbon footprints. 🌍 ${WEBSITE_URL}`;
    
    chrome.tabs.create({ 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` 
    });
  });
});

// Listen for auth updates from website
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_UPDATE') {
    if (message.token) {
      chrome.storage.local.set({ authToken: message.token });
      init(); // Reload popup
    }
  }
});
