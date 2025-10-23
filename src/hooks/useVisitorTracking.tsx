import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVisitorTracking = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Check if user declined tracking
        const trackingDisabled = localStorage.getItem('visitor_tracking_disabled') === 'true';
        if (trackingDisabled) {
          console.log('Visitor tracking disabled by user preference');
          return;
        }

        // Check for DNT (Do Not Track) header
        const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
        if (dnt === '1' || dnt === 'yes') {
          console.log('Do Not Track enabled, skipping visitor tracking');
          return;
        }

        // Generate or get session ID from localStorage
        let sessionId = localStorage.getItem('visitor_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          localStorage.setItem('visitor_session_id', sessionId);
        }

        await supabase.functions.invoke('track-visitor', {
          body: {
            session_id: sessionId,
            page_path: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
          }
        });
      } catch (error) {
        console.error('Visitor tracking error:', error);
      }
    };

    trackVisit();
  }, []);
};
