export function sendAnalyticalData(event_name) {
    gtag('event', event_name, {
        'event_category': 'engagement'
    });
}