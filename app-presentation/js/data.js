/* Andalusia app presentation — content and screen data (tickets 001, 002).
   Every fact here comes from the prototype's own screens (dummy data) or from FEATURES.md / FLOW_MAP.md / UX_AUDIT.md.
   Screens are captured by _ops/scripts/capture_screens.mjs from the real prototype (../10_redesign_film/02_design, our own doctors); rectangles are in the app's 390 x 844 space. */
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
  ,

  /* #features — the 13 new features, in the order and with the names of FEATURES.md. `pose` is the prototype state of the screen
     (window.__proto.fx.pose). `ar` is the screen's own Arabic title. `prop` marks a feature that shows one of the two proposals. */
  features: [
    { n: 1, screen: 'f01_live_ar', pose: 'live:vitals', name: 'Live visit', ar: 'الزيارة مباشرة',
      line: 'Follows the visit station by station, from arrival to the pharmacy, with the minutes left at each one.', from: 'Home card on the visit day', prop: 1 },
    { n: 2, screen: 'f02_time_ar', pose: 'time:delay', name: 'Your time is kept', ar: 'وقتك محفوظ',
      line: 'Tells you when to leave home. If the clinic runs late, you keep the visit, move it, or switch it to online.', from: 'The visit sheet on Home', prop: 1 },
    { n: 3, screen: 'f03_family_ar', pose: 'web:in-surgery', name: 'Family link', ar: 'رابط العائلة',
      line: 'One link lets a relative follow a surgery or a visit stage by stage, and pay a bill on the patient\u2019s behalf.', from: 'Share, on the live visit' },
    { n: 4, screen: 'f04_cost_ar', pose: 'confirm:approved', name: 'What you will pay before you book', ar: 'التكلفة أولاً',
      line: 'Your share shows before you book, and the insurance approval runs on the confirm screen.', from: 'The appointment and confirm steps' },
    { n: 5, screen: 'f05_insurance_ar', pose: 'insurance:bills', name: 'Insurance and bills', ar: 'التأمين والفواتير',
      line: 'Approvals, bills due and receipts in one place. Pay a bill and its row becomes the receipt.', from: 'Profile, and the confirm step' },
    { n: 6, screen: 'f06_voice_ar', pose: 'summary:voice', name: 'Doctor\u2019s voice note', ar: 'رسالة صوتية',
      line: 'The visit summary carries the doctor\u2019s voice note and its transcript, the medicines added and the follow-up booked.', from: 'The visit summary' },
    { n: 7, screen: 'f07_meds_ar', pose: 'meds:today', name: 'Medications', ar: 'الأدوية',
      line: 'Today\u2019s doses with a tick for each, a refill request, and a delivery you can follow.', from: 'The dose strip on Home' },
    { n: 8, screen: 'f08_call_ar', pose: 'call:countdown', name: 'Call me', ar: 'اتصلوا بي',
      line: 'One button, and a person calls you back. The screen counts down to the call.', from: 'All services, Insurance and bills, the live visit', prop: 1 },
    { n: 9, screen: 'f09_said_ar', pose: 'said:done', name: 'You said it. We did it.', ar: 'قلتوها… وسوّيناها',
      line: 'Leave one note after a visit and follow it until the change is made. A public wall shows what patients asked for.', from: 'The visit summary' },
    { n: 10, screen: 'f10_lock_ar', pose: 'lock:ahead', name: 'Queue on the lock screen', ar: 'شاشة القفل',
      line: 'Your turn without opening the app: when to leave, how many are ahead, when to walk in.', from: 'Queue, and the live visit' },
    { n: 11, screen: 'f11_there_ar', pose: 'there:ground', name: 'Getting there', ar: 'الوصول',
      line: 'Parking spaces, then the route inside the building floor by floor. \u201cI\u2019m here\u201d starts the live visit.', from: 'The visit sheet on Home' },
    { n: 12, screen: 'f12_year_ar', pose: 'year:everyone', name: 'Your health year', ar: 'عامك الصحي',
      line: 'The year\u2019s checks for the whole family on one screen: done, due, booked and coming up.', from: 'My health' },
    { n: 13, screen: 'f13_hajj_ar', pose: 'hajj:ready', name: 'Hajj and Umrah mode, and Ramadan', ar: 'الحج، العمرة، رمضان',
      line: 'A travel health checklist, a medical card in English and Arabic, and medicine times that follow Ramadan.', from: 'All services, and Medications' }
  ],

  /* #layers — the six things that lie over every screen (FEATURES.md, ticket 012). Each step is one phone whose screen is wiped from one
     state to the next. `states`: [screen file, label, 'ar' when the label is Arabic]. `dir`: the way the wipe travels. */
  layers: [
    { id: 'rtl', name: 'Arabic, right to left', short: 'Arabic', ar: 'العربية', dir: -1,
      line: 'The whole app switches at once.',
      note: 'The layout mirrors, icons that imply a direction flip, and the text is set in Graphik Arabic. Numbers, prices and times stay in Latin numerals.',
      states: [['home_en', 'English'], ['home_ar', 'العربية', 'ar']] },
    { id: 'dark', name: 'Dark mode', short: 'Dark', ar: 'داكن', dir: 1,
      line: 'Light, dark, or follow the device.',
      note: 'Not an inversion: dark tokens for surfaces, ink and glass. Portraits and maps are dimmed a little so they do not glare.',
      states: [['home_ar', 'Light'], ['home_dark_ar', 'Dark']] },
    { id: 'comfort', name: 'Comfort mode', short: 'Comfort', ar: 'الوضع المريح', dir: -1,
      line: 'Made for older patients.',
      note: 'Larger text, a simple Home with four large actions, medicines with pictures and one large \u201cI took it\u201d, and read aloud on the screens that matter.',
      states: [['home_ar', 'Standard'], ['ly_home_cz_ar', 'Simple Home'], ['ly_meds_cz_ar', 'Medicines with pictures']] },
    { id: 'family', name: 'Family accounts', short: 'Family', ar: 'العائلة', dir: 1,
      line: 'One account, four people.',
      note: 'Switch from the avatar on Home. The greeting, the next visit, today\u2019s doses and the results follow the person. A pill above the screen always says whose account it is.',
      states: [['home_ar', 'Ahmed'], ['ly_who_mariam_ar', 'Mariam'], ['ly_who_youssef_ar', 'Youssef'], ['ly_who_hassan_ar', 'Hassan']] },
    { id: 'first', name: 'First run', short: 'First run', ar: 'أهلاً بك', dir: -1,
      line: 'The introduction is the app itself.',
      note: 'Number, code, three steps that show live copies of real screens, permissions, then a choice: the standard look or the comfort look.',
      states: [['ly_first_phone_ar', 'Sign in'], ['ly_first_intro_ar', 'Three steps'], ['ly_first_comfort_ar', 'Choose a look']] },
    { id: 'present', name: 'Presentation mode', short: 'Present', ar: 'العرض', dir: 1,
      line: 'The app presents itself.',
      note: 'Five chapters. Every step is a real tap through the prototype, with a one-line caption outside the phone. It runs in English and Arabic, light and dark.',
      states: [['ly_first_comfort_ar', 'Choose a look']], win: 'ly_present_ar' }
  ],

  /* #before-after — matching screens (02_design/OLD_NEW_MAP.md rows 1, 2, 3, 7). Old screenshots: ../10_redesign_film/03_assets/old_app. */
  pairs: [
    { id: 'home', name: 'Home', old: 'old_home', now: 'home_en',
      before: 'A points banner, six equal picture tiles and three list rows. The next appointment is one tap away.',
      after: 'The next appointment and the health overview are on the first screen. Services sit below as one-line labels.' },
    { id: 'book', name: 'Booking', old: 'old_book', now: 'ba_book_en',
      before: 'Separate profile, day and slot steps.',
      after: 'Doctor, day, time and price on one screen, with one Book button.' },
    { id: 'queue', name: 'Queue', old: 'old_queue', now: 'ba_queue_en',
      before: 'Your number and \u201cnow serving\u201d are two equal tiles. The wait is one small line.',
      after: 'Your number is the largest thing on screen, the track shows who is being served up to you, and \u201ctell me 2 turns before\u201d is a switch you control.' },
    { id: 'results', name: 'Results', old: 'old_results', now: 'ba_results_en',
      before: 'Two rows, lab and radiology, each one more screen away. Family members sit behind an icon.',
      after: 'The newest ready result opens the screen with its key values on in-range bars. Lab and radiology share one list, and family members switch at the top.' }
  ]
};
