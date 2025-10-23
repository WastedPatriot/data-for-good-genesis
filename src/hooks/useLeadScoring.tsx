import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LeadScore {
  score: number;
  pageViews: number;
  highIntentPages: string[];
  sessionStart: string;
}

export const useLeadScoring = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if tracking is disabled
    const trackingDisabled = localStorage.getItem('visitor_tracking_disabled') === 'true';
    if (trackingDisabled) return;

    const sessionId = localStorage.getItem('visitor_session_id');
    if (!sessionId) return;

    // Get or initialize lead score data
    let leadData: LeadScore = {
      score: 0,
      pageViews: 0,
      highIntentPages: [],
      sessionStart: new Date().toISOString(),
    };

    const existingData = localStorage.getItem('lead_score_data');
    if (existingData) {
      try {
        leadData = JSON.parse(existingData);
      } catch (e) {
        console.error('Error parsing lead score data:', e);
      }
    }

    // Update page views
    leadData.pageViews++;

    // High-intent pages scoring
    const currentPath = location.pathname;
    const highIntentPages = [
      { path: '/marketplace', points: 20 },
      { path: '/contribute', points: 25 },
      { path: '/donate', points: 30 },
      { path: '/organization-signup', points: 35 },
      { path: '/login', points: 15 },
    ];

    highIntentPages.forEach(({ path, points }) => {
      if (currentPath === path && !leadData.highIntentPages.includes(path)) {
        leadData.score += points;
        leadData.highIntentPages.push(path);
      }
    });

    // Dataset pages
    if (currentPath.includes('/dataset') && !leadData.highIntentPages.includes('dataset_view')) {
      leadData.score += 25;
      leadData.highIntentPages.push('dataset_view');
    }

    // Engagement scoring
    leadData.score += 2; // Per page view

    // Session duration bonus (calculated separately in analytics)
    const sessionDuration = (new Date().getTime() - new Date(leadData.sessionStart).getTime()) / 1000 / 60;
    const durationBonus = Math.min(sessionDuration * 0.5, 25);
    
    // Calculate total score
    const totalScore = Math.min(leadData.score + durationBonus, 100);

    // Store updated data
    localStorage.setItem('lead_score_data', JSON.stringify(leadData));

    // If high score, trigger notification (optional)
    if (totalScore >= 70 && !localStorage.getItem('high_intent_notified')) {
      localStorage.setItem('high_intent_notified', 'true');
      console.log('High-intent visitor detected:', totalScore);
      // Could trigger a modal or special offer here
    }

  }, [location.pathname]);
};
