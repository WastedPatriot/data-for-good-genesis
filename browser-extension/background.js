// Background service worker
console.log('DataForEarth Extension: Background script initialized');

// Track visited domains
const visitedDomains = new Set();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = getDomain(tab.url);
    if (domain && !visitedDomains.has(domain)) {
      visitedDomains.add(domain);
      checkAndNotify(domain);
    }
  }
});

// Extract domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Check if company has carbon data and notify
async function checkAndNotify(domain) {
  try {
    const response = await fetch(
      `https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-company-data?domain=${domain}`
    );
    const data = await response.json();
    
    if (data.company) {
      // Show notification for high-emission companies
      if (data.company.annual_co2_tons > 10000000) { // 10M+ tons
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon-128.png',
          title: '⚠️ High Carbon Footprint Detected',
          message: `${data.company.company_name} emits ${formatCO2(data.company.annual_co2_tons)} annually. View datasets to track their impact.`,
          priority: 2
        });
      }

      // Update badge with sustainability score
      chrome.action.setBadgeText({ text: data.company.sustainability_score.toString() });
      const color = getScoreColor(data.company.sustainability_score);
      chrome.action.setBadgeBackgroundColor({ color });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error checking company:', error);
  }
}

// Format CO2 helper
function formatCO2(tons) {
  if (tons >= 1000000) return (tons / 1000000).toFixed(1) + 'M tons';
  if (tons >= 1000) return (tons / 1000).toFixed(0) + 'K tons';
  return tons.toFixed(0) + ' tons';
}

// Get color based on score
function getScoreColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_DURATION') {
    // Log page duration for analytics
    console.log('Page duration:', message.domain, message.duration, 'seconds');
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page
    chrome.tabs.create({
      url: 'https://492e7fd1-6e30-483a-bddd-e3199d936946.lovableproject.com/welcome-extension'
    });
  }
});
