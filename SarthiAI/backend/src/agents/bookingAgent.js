import { callAI } from './callAI.js';

const SYSTEM_PROMPT = `You are a specialized booking agent for travel. Your task is to draft professional booking inquiry emails based on hotel recommendations and itinerary activities.

Return ONLY valid JSON. No markdown, no code fences, no extra text.

Use this exact JSON structure:
{
  "booking_emails": [
    {
      "type": "hotel or activity",
      "to": "Recipient name",
      "subject": "Email subject line",
      "body": "Full email body in plain text with proper salutation, details, and closing",
      "notes": "Additional notes for the traveler"
    }
  ]
}

RULES:
- Each email should be professional and polite
- For hotels: mention check-in/out dates, number of guests, any special requests
- For activities: mention date, number of people, any preferences
- Body should be 3-5 paragraphs
- Subjects should be descriptive but concise`;

export async function runBookingAgent(destination, duration, hotels, itineraryDays) {
  const topHotelNames = (hotels || []).slice(0, 2).map(h => h.name).filter(Boolean);
  const topActivities = (itineraryDays || []).slice(0, 3).flatMap(d =>
    (d.activities || []).slice(0, 2).map(a => a.title)
  ).filter(Boolean);

  const userPrompt = `Draft booking emails for a ${duration}-day trip to ${destination}.

Hotels to contact: ${topHotelNames.join(', ') || 'None specified'}
Activities to book: ${topActivities.join(', ') || 'None specified'}
Trip duration: ${duration} days

Draft professional booking inquiry emails for the hotels and key activities.`;

  try {
    const result = await callAI(SYSTEM_PROMPT, userPrompt, 0.5);
    return Array.isArray(result?.booking_emails) ? result.booking_emails : [];
  } catch (e) {
    console.error('BookingAgent failed:', e?.message || e);
    const emails = [];
    if (topHotelNames.length > 0) {
      emails.push({
        type: 'hotel',
        to: topHotelNames[0],
        subject: `Booking Inquiry: ${duration}-night stay in ${destination}`,
        body: `Dear ${topHotelNames[0]},\n\nI am planning a trip to ${destination} and would like to inquire about availability for a ${duration}-night stay.\n\nCould you please provide information on room availability, rates, and any available packages?\n\nThank you for your assistance.\n\nBest regards,\nTraveler`,
        notes: 'Send this email or call directly for faster response',
      });
    }
    if (topActivities.length > 0) {
      emails.push({
        type: 'activity',
        to: topActivities[0],
        subject: `Booking: ${topActivities[0]} during ${destination} trip`,
        body: `Dear ${topActivities[0]} Team,\n\nI am interested in booking ${topActivities[0]} during my upcoming trip to ${destination}.\n\nPlease let me know about availability, pricing, and booking procedures.\n\nThank you.\n\nBest regards,\nTraveler`,
        notes: 'Check online for any discounts or combo deals',
      });
    }
    return emails;
  }
}
