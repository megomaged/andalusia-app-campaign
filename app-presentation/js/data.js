/* Andalusia app presentation — content and screen data (ticket 001).
   Every fact here comes from the prototype's own screens (dummy data) or from FEATURES.md / FLOW_MAP.md / UX_AUDIT.md.
   Screens are captured by _ops/scripts/capture_screens.mjs from the public build; rectangles are in the app's 390 x 844 space. */
window.SITE = {
  screens: 'assets/screens/',

  /* the phone in the hero: Home, with two of its cards lifted off the glass */
  hero: {
    screen: 'home_ar',
    lifts: [
      { rect: [16, 300, 358, 232, 32], z: 96 },          /* next-visit card */
      { rect: [16, 544, 358, 64, 32], z: 52 }            /* next-dose strip */
    ],
    ghosts: ['live_visit_ar', 'wallet_ar', 'lock_ar', 'home_dark_ar']
  },

  /* section A — one visit, start to finish. `into` is the motion that brings the screen in (the app's own motion system, mirrored for Arabic):
     push = forward navigation, success = change of context with a spring, rise = a new moment from below */
  journey: [
    { id: 'home', screen: 'home_ar', name: 'Home', short: 'Home', ar: 'الرئيسية',
      line: 'Home opens on today.',
      note: 'Your next visit, your next dose and your points, before anything else.',
      lift: [16, 300, 358, 232, 32] },
    { id: 'find', screen: 'find_doctor_ar', name: 'Find a doctor', short: 'Doctor', ar: 'ابحث عن طبيب', into: 'push',
      line: 'Which doctor would you like to see?',
      note: 'Filter by specialty. The nearest come first, each with a rating and the next free time.',
      lift: [16, 285, 358, 96, 32] },
    { id: 'doctor', screen: 'doctor_ar', name: 'The appointment', short: 'Time', ar: 'الموعد', into: 'push',
      line: 'Pick a day, then a time.',
      note: 'Nothing is pre-selected, and the days and times that are gone cannot be tapped.',
      lift: [16, 358, 358, 208, 32] },
    { id: 'cost', screen: 'cost_ar', name: 'Cost before booking', short: 'Cost', ar: 'تأكيد الزيارة', into: 'push',
      line: 'What you will pay, before you book.',
      note: 'The insurance approval runs on the same screen. In this example the fee goes from 600 EGP to 60.',
      lift: [16, 398, 358, 274, 32] },
    { id: 'booked', screen: 'booked_ar', name: 'Booked', ar: 'تم الحجز', into: 'success',
      line: 'Booked.',
      note: 'Date, time, clinic and queue number on one ticket, with the points you earned.',
      lift: [16, 438, 358, 224, 32] },
    { id: 'live', screen: 'live_visit_ar', name: 'Live visit', short: 'Live visit', ar: 'زيارتك', into: 'rise',
      line: 'On the day, the visit is live.',
      note: 'Seven stations from arrival to the pharmacy and out: where to go now, and how many minutes are left.',
      lift: [16, 120, 358, 229, 32] }
  ]
};
