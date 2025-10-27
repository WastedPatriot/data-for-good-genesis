// Content script - injected into every page
console.log('DataForEarth Extension: Content script loaded');

// Extract domain
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// Inject floating badge showing company carbon data
async function injectCarbonBadge() {
  const domain = getDomain(window.location.href);
  if (!domain) return;

  try {
    const response = await fetch(
      `https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-company-data?domain=${domain}`
    );
    const data = await response.json();
    
    if (data.company) {
      createFloatingBadge(data.company);
    }
  } catch (error) {
    console.error('DataForEarth: Error loading company data', error);
  }
}

// Create floating carbon badge
function createFloatingBadge(company) {
  // Check if badge already exists
  if (document.getElementById('dfe-carbon-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'dfe-carbon-badge';
  badge.className = 'dfe-carbon-badge';
  
  // Format emissions
  const formatCO2 = (tons) => {
    if (tons >= 1000000) return (tons / 1000000).toFixed(1) + 'M';
    if (tons >= 1000) return (tons / 1000).toFixed(0) + 'K';
    return tons.toFixed(0);
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  badge.innerHTML = `
    <div class="dfe-badge-header">
      <span class="dfe-badge-icon">🌍</span>
      <span class="dfe-badge-title">${company.company_name}</span>
      <button class="dfe-badge-close" id="dfe-close-badge">×</button>
    </div>
    <div class="dfe-badge-content">
      <div class="dfe-emission-stat">
        <div class="dfe-emission-label">Annual CO₂</div>
        <div class="dfe-emission-value">${formatCO2(company.annual_co2_tons)} tons</div>
      </div>
      <div class="dfe-score-bar">
        <div class="dfe-score-label">
          <span>Sustainability</span>
          <span style="color: ${getScoreColor(company.sustainability_score)}">${company.sustainability_score}/100</span>
        </div>
        <div class="dfe-score-track">
          <div class="dfe-score-fill" style="width: ${company.sustainability_score}%; background: ${getScoreColor(company.sustainability_score)}"></div>
        </div>
      </div>
      <div class="dfe-badge-footer">
        <span class="dfe-verified">✓ Verified Data</span>
        <a href="https://492e7fd1-6e30-483a-bddd-e3199d936946.lovableproject.com/marketplace" target="_blank" class="dfe-learn-more">
          View Datasets →
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(badge);

  // Close button handler
  document.getElementById('dfe-close-badge')?.addEventListener('click', () => {
    badge.remove();
  });

  // Make badge draggable
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  const header = badge.querySelector('.dfe-badge-header');
  header.style.cursor = 'move';

  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'dfe-close-badge') return;
    isDragging = true;
    initialX = e.clientX - badge.offsetLeft;
    initialY = e.clientY - badge.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    badge.style.left = currentX + 'px';
    badge.style.top = currentY + 'px';
    badge.style.right = 'auto';
    badge.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

// Track page time
let startTime = Date.now();

window.addEventListener('beforeunload', async () => {
  const duration = Math.floor((Date.now() - startTime) / 1000);
  const domain = getDomain(window.location.href);
  
  if (duration > 5 && domain) {
    // Send duration to background script
    chrome.runtime.sendMessage({
      type: 'PAGE_DURATION',
      domain,
      duration
    });
  }
});

// Initialize
setTimeout(injectCarbonBadge, 1000); // Delay to let page load
