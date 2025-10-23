import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVisitorTracking = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
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
