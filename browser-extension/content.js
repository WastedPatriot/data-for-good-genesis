// Anonymous tracking - no authentication required
let pageStartTime = Date.now();
let domain = null;

try {
  domain = window.location.hostname.replace('www.', '');
} catch (e) {
  console.error('Error getting domain:', e);
}

// Send duration when leaving page
window.addEventListener('beforeunload', () => {
  if (domain) {
    const duration = Math.floor((Date.now() - pageStartTime) / 1000);
    chrome.runtime.sendMessage({
      type: 'PAGE_DURATION',
      domain,
      duration
    });
  }
});

// Fetch company carbon data
async function fetchCompanyData() {
  if (!domain) return null;
  
  try {
    const response = await fetch(
      `https://fszghwwbvxwkmgfvhzrh.supabase.co/functions/v1/extension-company-data?domain=${encodeURIComponent(domain)}`
    );
    const data = await response.json();
    return data.company;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
}

// Create and show carbon badge
async function showCarbonBadge() {
  const company = await fetchCompanyData();
  if (!company) return;

  const badge = document.createElement('div');
  badge.id = 'dataforearth-badge';
  badge.innerHTML = `
    <div class="badge-content">
      <div class="badge-header">
        <span class="badge-icon">🌍</span>
        <span class="badge-title">DataForEarth</span>
        <button class="badge-close" id="badge-close">×</button>
      </div>
      <div class="badge-body">
        <div class="badge-company">${company.company_name}</div>
        <div class="badge-co2">${formatNumber(company.annual_co2_tons || 0)} tons CO₂/year</div>
        ${company.sustainability_score ? `
          <div class="badge-score score-${getScoreLevel(company.sustainability_score)}">
            Sustainability: ${company.sustainability_score}/100
          </div>
        ` : ''}
        <div class="badge-disclaimer">
          <small>Anonymous tracking • Raising awareness</small>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(badge);

  // Make badge draggable
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  badge.addEventListener('mousedown', (e) => {
    if (e.target.id === 'badge-close') return;
    isDragging = true;
    initialX = e.clientX - badge.offsetLeft;
    initialY = e.clientY - badge.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      badge.style.left = currentX + 'px';
      badge.style.top = currentY + 'px';
      badge.style.right = 'auto';
      badge.style.bottom = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Close button
  document.getElementById('badge-close').addEventListener('click', () => {
    badge.remove();
  });
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function getScoreLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// Show badge after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showCarbonBadge);
} else {
  showCarbonBadge();
}
