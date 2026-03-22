import { NextResponse } from 'next/server';

// This runs as a Vercel cron job daily at 6 AM UTC (11:30 AM IST)
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Dynamic imports to avoid bundling issues
    const { createClient } = await import('@supabase/supabase-js');
    const webpush = await import('web-push');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!  // Use service role for server-side
    );

    webpush.setVapidDetails(
      'mailto:noreply@panchang.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get today's date and upcoming dates
    const today = new Date();
    const dateKeys: string[] = [];
    for (let offset = 0; offset <= 14; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateKeys.push(key);
    }

    // Query notification preferences that match upcoming dates
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('enabled', true)
      .in('date_key', dateKeys);

    if (!prefs || prefs.length === 0) {
      return NextResponse.json({ message: 'No notifications due', sent: 0 });
    }

    // Filter: only send if today is exactly (days_before) days before the date
    const todayDate = today;
    const dueNotifications = prefs.filter((p) => {
      const [y, m, d] = p.date_key.split('-').map(Number);
      const eventDate = new Date(y, m - 1, d);
      const diffDays = Math.round((eventDate.getTime() - todayDate.getTime()) / (86400000));
      if (p.repeat === 'daily') {
        return diffDays >= 0 && diffDays <= p.days_before;
      }
      return diffDays === p.days_before;
    });

    if (dueNotifications.length === 0) {
      return NextResponse.json({ message: 'No notifications due today', sent: 0 });
    }

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No push subscriptions', sent: 0 });
    }

    // Send notifications – match each notification to subscriptions by pin_hash
    let sent = 0;
    for (const notif of dueNotifications) {
      const [y, m, d] = notif.date_key.split('-').map(Number);
      const eventDate = new Date(y, m - 1, d);
      const diffDays = Math.round((eventDate.getTime() - todayDate.getTime()) / 86400000);

      const title = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
      const body = notif.label || `Event on ${notif.date_key}`;

      // Find push subscriptions for the same user (by pin_hash)
      const targetSubs = subscriptions.filter(s => s.pin_hash === notif.pin_hash);

      for (const sub of targetSubs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            },
            JSON.stringify({ title: `Panchang: ${title}`, body })
          );
          sent++;
        } catch (err: any) {
          // Remove invalid subscriptions (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return NextResponse.json({ message: 'Notifications sent', sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
