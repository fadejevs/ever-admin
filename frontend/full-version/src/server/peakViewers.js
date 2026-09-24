import 'server-only';

import { supabase } from '@/utils/supabase/server';
import { isEventId, normalizePeakViewerCount } from '@/server/peakViewerCount';

export { isEventId, normalizePeakViewerCount };

export async function bumpEventPeakViewers(eventId, viewerCount) {
  const incoming = normalizePeakViewerCount(viewerCount);
  if (!isEventId(eventId) || incoming <= 0) {
    return { ok: true, updated: false, peak_viewer_count: incoming };
  }

  const { data, error } = await supabase.rpc('bump_event_peak_viewers', {
    p_event_id: eventId,
    p_viewer_count: incoming
  });

  if (error) {
    console.error('[peakViewers] bump failed', eventId, error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, peak_viewer_count: Number(data) || incoming };
}

export async function syncLiveRoomPeaks(roomMap) {
  const rooms = roomMap instanceof Map ? [...roomMap.entries()] : [];
  if (!rooms.length) return;

  await Promise.all(
    rooms.map(([id, room]) =>
      bumpEventPeakViewers(id, room?.viewer_count).catch((error) => {
        console.error('[peakViewers] sync failed', id, error?.message || error);
        return { ok: false };
      })
    )
  );
}
