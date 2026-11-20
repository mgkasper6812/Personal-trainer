# AI and Adaptive Personal-Training / Coaching Apps: Competitive Teardown (as of Nov 2026)

Research method note: Every finding came from web search results. Direct page fetches failed because the session's network blocked these hosts: garagegymreviews.com, whoop.com, gearpatrol.com, and the5krunner.com. Some details below therefore come from search-result summaries, not full pages. Treat exact prices as "verify at checkout." Several sources are vendor blogs, notably Fitbod's own blog and Oura's/WHOOP's own pages; these are flagged where relied on.

## How is "today's workout/plan" presented (home layout, cards, exercise list, demos, timers, logging)?

### Takeaway
Two dominant models exist. Strength apps (Fitbod, Future, Ladder, Caliber, Peloton Strength+) show a generated or coach-written session as an exercise list with video demos and per-set logging. Readiness apps (WHOOP, Oura, Gentler Streak, Garmin) show a morning score card and a recommended intensity or target rather than a full workout. The newest trend, seen in 2025–2026 WHOOP, Garmin and Apple releases, layers an AI text or voice summary on top of the score.

### Cited Findings
- **Fitbod:** Fitbod generates each session from five inputs: fitness goal, experience level, available equipment, training split and workout preferences — [Fitbod Review / ScreensDesign summary](https://screensdesign.com/showcase/fitbod-gym-fitness-planner); [Fitbod help: How Fitbod creates your workout](https://help.fitbod.me/hc/en-us/sections/360001078993-Understanding-Fitbod-How-It-Works)
- **Fitbod:** Exercises are selected by a muscle-recovery model that estimates how recovered each muscle group is from recent training. Fatigue is weighted by set heaviness and set count — [Gainframe Fitbod review](https://gainframe.app/blog/fitbod-app-review/); [AIToolsBakery Fitbod review 2026](https://aitoolsbakery.com/?p=5902)
- **Fitbod:** The recovery map is a model, not a physical measurement — [Gainframe](https://gainframe.app/blog/fitbod-app-review/)
- **Fitbod Apple Watch:** Sets can be logged and exercises marked complete on the watch. Swapping or adding exercises mid-workout requires the iPhone, and the watch cannot save a workout on its own — [Fitbod Help: Apple Watch](https://help.fitbod.me/hc/en-us/articles/360006499194-Apple-Watch)
- **Fitbod rest timer:** The watch app does not support Always On, so the rest timer pauses when the screen dims and may not fire a rest notification — [Fitbod Help: Apple Watch](https://help.fitbod.me/hc/en-us/articles/360006499194-Apple-Watch)
- **Ladder:** Users take a quiz, join a coach-led "team," and get weekly plans with in-ear coaching, video demonstrations and "precise pacing" built in. Users are on one workout track at a time — [Ladder App Store](https://apps.apple.com/us/app/-/id1502936453); [SensAI Ladder review 2026](https://www.sensai.fit/blog/ladder-app-review-2026)
- **Future:** A single certified human coach writes the program, adjusts it weekly, and messages the user in the app. The exercise library has video demos, voice cues and form guidance, and the app supports Apple Watch — [SensAI Future review 2026](https://www.sensai.fit/blog/future-app-review-2026); [Future FAQ](https://www.future.co/faq)
- **Peloton Strength+:** A standalone app with self-paced, multi-week strength programs, a customizable workout generator, instructional video clips and progress tracking — [Peloton blog: Strength+](https://www.onepeloton.com/en-CA/blog/peloton-strength-plus-app)
- **Peloton IQ (hardware):** Real-time camera form correction and progressive-overload prompts; a T3 demo saw the AI flag a weight increase — [T3 Peloton IQ demo](https://www.t3.com/active/peloton-iq-ai-training-demo); [Engadget](https://www.engadget.com/general/peloton-cross-training-bike-tread-row-plus-machines-form-checking-cameras-rotating-screens-ai-price-launch-date-110042677.html?src=rss)
- **WHOOP:** Strain is scored 0–21, and the app recommends an optimal target exertion range based on that morning's Recovery score — [WHOOP App Store](https://apps.apple.com/app/id933944389)
- **WHOOP Daily Outlook:** A morning view with personalized recommendations on when to push, when to rest and how to optimize, paired with a nightly "Day in Review" — [WHOOP: New AI guidance](https://www.whoop.com/us/en/thelocker/new-ai-guidance-from-whoop/); [Gadgets & Wearables, Jan 2025](https://gadgetsandwearables.com/2025/01/24/whoop-daily-outlook/)
- **WHOOP AI Workout Generation (Feb 2026):** Users build custom workouts by telling WHOOP AI their goals, equipment, muscle groups or limitations. AI also simplifies exercise linking in Strength Trainer — [WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/); [Wareable](https://www.wareable.com/fitness-trackers/whoop-coach-ai-strength-trainer-workout-builder-update)
- **Oura:** Readiness Score draws on nine contributors measured against personal averages, including sleep balance, sleep regularity, resting heart rate and recovery index. The app needs up to two weeks to learn baselines. Below 70 is the "prioritize rest" signal — [Oura Support](https://support.ouraring.com/hc/en-us/articles/4409086524819)
- **Oura Advisor:** Recommends workout intensity from readiness but does not write workout plans. This is a third-party claim — [US Mobile blog](https://www.usmobile.com/blog/oura-advisor-ai/)
- **Gentler Streak:** Its core screen, the "Activity Path," is a daily zone from Rest to Active. It updates from HRV, resting HR, sleep and recent load, and needs an Apple Watch — [Lifestack: Gentler Streak](https://lifestack.ai/blog/gentler-streak)
- **Garmin Daily Suggested Workouts:** Garmin recommends workouts from previous activities. On the Forerunner 265 they update with training habits, recovery time and VO2 max. Some devices need a VO2 max estimate, or a week of HR and power riding, before suggestions appear — [Garmin manual](https://www8.garmin.com/manuals/webhelp/GUID-28E0106C-B05A-44E9-BF7C-9CB36A596B82/EN-US/GUID-AFECC098-0B34-4913-9944-66E8DAF64039.html); [Garmin FR265 manual](https://www8.garmin.com/manuals-apac/webhelp/forerunner265series/EN-SG/GUID-D9D7CFDE-ED13-47E7-B817-626C6D6C2887-7792.html)
- **Apple Workout Buddy (watchOS 26, 2025):** An AI voice that "brings a Fitness+ trainer along" during workouts. It offers three synthetic voices and requires an Apple Intelligence–capable iPhone — [Six Colors](https://sixcolors.com/post/2025/09/watchos-26-review-wrist-reward-ratio/); [Yahoo Tech](https://tech.yahoo.com/wearables/articles/underestimated-workout-buddy-apples-playing-173600647.html)

### Inferences
- For a PWA, the best pattern is a hybrid: a single "Today" card with a readiness or check-in answer, a one-line reason, the session's duration and focus, and a Start button. Below it, an exercise list with a demo thumbnail per row, tap-to-log sets with weight and reps pre-filled from last time, and an auto-starting rest timer.
- Fitbod's documented rest-timer failures on the watch, where it pauses when the screen dims, are a warning for a PWA. iOS Safari throttles timers in background tabs. Store the timer's end time and compute the remainder, rather than counting down in JavaScript. Use the Screen Wake Lock API during sessions.
- Ladder and Workout Buddy show that audio cues ("next set in 10s", pacing) make home workouts work hands-free. Web Speech or pre-recorded audio could approximate this.

### Gaps
- I could not get exact screen-level layouts, such as card order or tab bar items, for Fitbod, Caliber or Future, because review pages could not be fetched. App Store screenshots were not accessible as text.
- Caliber's in-workout UI detail was not found beyond onboarding.

## How do they adapt day-to-day, and how is the reasoning explained?

### Takeaway
Adaptation comes from three sources: wearable physiology (WHOOP, Oura, Garmin, Gentler Streak), logged performance and history (Fitbod's muscle-recovery model, Runna's pace analysis), and explicit user input ("Not Feeling 100%", time available, equipment, limitations). Explanations are increasingly delivered by LLM chat, not by static score breakdowns, and users distrust explanations that are shallow or hallucinated.

### Cited Findings
- **Fitbod:** Recovery state, workout structure, goals, equipment and recent history all shape each session — [Fitbod vs Gravl (vendor blog)](https://fitbod.me/blog/fitbod-vs-gravl-strength-training-app-review/); [Gainframe](https://gainframe.app/blog/fitbod-app-review/)
- **Fitbod complaint:** Users report repetitive workouts. One complaint is titled "Fitbod gave me repetitive workouts and an unreliable app experience" — [Sikayetvar](https://www.sikayetvar.com/en/fitbod-us/fitbod-gave-me-repetitive-workouts-and-an-unreliable-app-experience)
- **Runna (owned by Strava since April 2025):** Adaptation is mainly pace analysis on tempo and interval sessions. It changes pace targets if a user repeatedly misses or beats them — [the5krunner, "Is Runna AI?", Sep 2026](https://the5krunner.com/2026/09/28/is-runna-ai/) (search snippet only; fetch blocked)
- **Runna:** A "Not Feeling 100%" option adapts training for illness or limited time, and "Holiday Mode" gives a gradual return after time off — [Tom's Guide](https://www.tomsguide.com/wellness/running/this-is-the-running-app-im-using-to-train-for-my-sixth-marathon-and-it-just-got-even-better-for-beginners-too); [Wareable](https://www.wareable.com/running/inside-runna-app-plan-changes-new-features-academic-review-loughborough-stanford-steph-kessell)
- **Runna criticism:** Critics called its pace targets and week-over-week mileage ramps too aggressive, raising injury risk. Runna commissioned a Loughborough University review of progression, intensity distribution and recovery — [TechRadar](https://www.techradar.com/health-fitness/are-ai-training-apps-like-runna-putting-you-at-risk-of-injury-i-asked-a-real-life-running-coach); [Wareable](https://www.wareable.com/running/inside-runna-app-plan-changes-new-features-academic-review-loughborough-stanford-steph-kessell)
- **Ladder:** Programming is for the whole team, not per member. "Programs are designed for a whole team, not per-member" — [SensAI Ladder review 2026](https://www.sensai.fit/blog/ladder-app-review-2026)
- **Future:** A human coach adjusts the plan weekly — [SensAI Future review](https://www.sensai.fit/blog/future-app-review-2026). Future ran a free AI-coaching beta in 2026 and cancelled it in June 2026; as of September 2026 members get no AI coach — [SensAI Future review](https://www.sensai.fit/blog/future-app-review-2026) (single source; unverified elsewhere)
- **WHOOP:** The Strain target is derived from Recovery — [WHOOP App Store](https://apps.apple.com/app/id933944389). WHOOP Coach answers from the user's own metrics, for example explaining why recovery is low, and answers deepen as more Journal data is logged — [TechSifted / DEV](https://dev.to/techsifted/whoop-review-2026-is-the-subscription-model-worth-it-n2c); [Boardroom](https://boardroom.tv/tech-talk-reviews-whoop-coach-openai/)
- **WHOOP Memory (spring 2026):** Coaching remembers context. Memory tracks temporary patterns, such as past sickness, "but won't actively coach you on them" — [WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/); [WHOOP press release](https://www.whoop.com/ae/en/press-center/whoop-expands-health-platform-with-on-demand-clinician-access-and-new-ai-features/)
- **Oura:** Advisor can be opened from Readiness insight messages and shows data as charts. Oura warns it may give "unexpected responses" and that its numbers may differ from other app sections — [Oura Support: Advisor](https://support.ouraring.com/hc/en-us/articles/39512345699219/)
- **Oura Labs:** In Oura's own Labs testing, 60% said Advisor helped them understand metrics they didn't grasp before. This is a self-reported vendor survey — [BusinessWire, Mar 2025](https://www.businesswire.com/news/home/20250331565896/en/Oura-Advisor-an-AI-powered-Personal-Health-Companion-Now-Rolling-Out-to-All-Oura-Members)
- **Oura Symptom Radar:** Flags deviations from baseline and can prompt the user to turn on Rest Mode — [Oura blog](https://ouraring.com/blog/?p=934969)
- **Garmin Active Intelligence (Connect+):** One review criticized its analysis for looking only at a run's average pace rather than the splits, and for summarizing only the most recent activity — [Tom's Guide](https://www.tomsguide.com/wellness/smartwatches/i-tried-garmin-connect-for-a-week-heres-3-things-i-like-and-3-i-dislike). Another review says it "restates thin insights" — [the5krunner, Apr 2026](https://the5krunner.com/2026/04/20/garmin-connect-plus-review/) (snippet). A third calls it a beginner-friendly, text-heavy version of existing readiness metrics — [Android Central](https://www.androidcentral.com/wearables/new-garmin-connect-plus-subscription-adds-active-intelligence-beta-enhanced-smarts)
- **Apple:** Activity ring goals can be set per weekday. "Change for Today" sets a temporary goal, and rings can be paused for up to 90 days without breaking the streak (watchOS 11+) — [Apple Support](https://support.apple.com/en-us/HT212501); [MacRumors](https://www.macrumors.com/2024/06/18/watchos-11-custom-activity-goals-different-days); [9to5Mac](https://9to5mac.com/2024/07/16/close-your-ringsbut-in-watchos-11-its-okay-if-you-dont/)

### Inferences
- Without a wearable, which is likely for a PWA, the copyable inputs are a 10-second morning check-in (sleep, soreness, energy, minutes available, location or equipment) plus performance history. That is effectively Runna's "Not Feeling 100%" combined with Fitbod's history-based recovery model.
- Explanations should cite concrete inputs: "You logged heavy legs Tuesday and said soreness is 4/5, so today is upper body, 20 min." Avoid generic restating, which is the main criticism of Garmin Active Intelligence.
- Cap progression rates explicitly (Runna's injury controversy) and especially conservatively for a teen.

### Gaps
- I found no source detailing how Fitbod handles a missed workout, beyond its recovery model rolling forward. The same goes for Caliber's adaptation logic.

## Morning/evening touchpoints, notifications, streaks, rings, weekly summaries, progress views

### Takeaway
The proven cadence is a morning outlook, in-session cues, and an evening review (WHOOP Daily Outlook plus Day in Review; Garmin's prompts at wake, after workouts and in the evening). Streak systems are moving toward forgiveness: Apple added ring pauses and per-day goals, and Gentler Streak is built around rest.

### Cited Findings
- **WHOOP:** Daily Outlook in the morning and Day in Review at night — [WHOOP AI guidance](https://www.whoop.com/us/en/thelocker/new-ai-guidance-from-whoop/)
- **Garmin Active Intelligence:** Prompts come at wake, after workouts and in the evening, drawing on sleep, HRV, training load and stress — [the5krunner Connect+ review, Apr 2026](https://the5krunner.com/2026/04/20/garmin-connect-plus-review/) (snippet)
- **Apple rings:** Users can pause streaks up to 90 days and set goals per weekday; framed by press as "close your rings… but it's OK if you don't" — [9to5Mac](https://9to5mac.com/2024/07/16/close-your-ringsbut-in-watchos-11-its-okay-if-you-dont/); [Android Authority](https://www.androidauthority.com/apple-rings-finally-cares-about-my-real-world-schedule-3485084)
- **Gentler Streak:** The free tier covers logging and streaks, and the streak model is built on a rest-to-active zone rather than daily maximal effort — [Lifestack](https://lifestack.ai/blog/gentler-streak)
- **Caliber:** "Strength Score" measures strength relative to potential for age and gender and is part of the paid Caliber Plus tier — [Caliber App Store](https://apps.apple.com/us/app/caliber/id1482405410)
- **Peloton Strength+:** Detailed progress tracking is advertised — [Peloton blog](https://www.onepeloton.com/en-CA/blog/peloton-strength-plus-app)

### Inferences
- Copy: per-day goals, a "pause" or "sick week" toggle that protects the streak, and a weekly consistency calendar, for example days trained out of days planned. For the teen athlete, season-aware schedule weeks (in-season vs off-season) map naturally to Apple's per-weekday goals.
- PWA constraint: iOS web push works only for home-screen-installed PWAs (iOS 16.4+). This is general platform knowledge, not sourced in this research; verify. Keep notifications to at most one morning nudge and one optional evening recap.

### Gaps
- I did not find specific weekly-summary layouts for Fitbod or Caliber, or PR-celebration patterns, in accessible sources.

## AI chat / coach messaging UX: proactive vs on-demand, tone, avoiding annoyance

### Takeaway
2026 coaches are moving from on-demand chat to proactive check-ins with memory (WHOOP, May 2026). Users push back when the proactive coach feels intrusive or deficit-focused, or hallucinates. The human-coach model (Future) remains the gold standard for accountability, but costs about $199/month, and Future dropped its AI-coach beta.

### Cited Findings
- **WHOOP:** WHOOP announced Memory and Proactive Check-Ins in May 2026 as a "persistent context layer… without requiring members to repeat themselves" — [WHOOP press release](https://www.whoop.com/ae/en/press-center/whoop-expands-health-platform-with-on-demand-clinician-access-and-new-ai-features/); [TechTarget](https://www.techtarget.com/virtualhealthcare/news/366643016/Whoop-adds-telehealth-AI-features-to-wearable-fitness-tracker)
- **WHOOP complaint:** A long-time member says the new Coach feels intrusive and deficit-focused, and asks for control over when it can contact them, with options such as never, only important observations, after activities, or a daily summary — [WHOOP Community thread](https://www.community.whoop.com/t/the-new-whoop-coach-feels-very-different-and-not-in-a-good-way/15960)
- **WHOOP reception:** On r/Whoop, some users report very positive experiences while others report hallucinations, such as a wrong answer about elevation gain on a hike. Gear Patrol notes the most-touted AI features were still labeled Beta — [Gear Patrol](https://www.gearpatrol.com/fitness/whoop-ai-reddit-user-feedback-pros-cons/) (snippet)
- **Oura Advisor:** On-demand chat that can be entered from Readiness messages. Conversation history arrived in app version 7.17.0 (June 2026), and a proprietary women's-health LLM was added in April 2026 — [Oura Support](https://support.ouraring.com/hc/en-us/articles/39512345699219/); [Oura blog](https://ouraring.com/blog/oura-advisor)
- **Apple Workout Buddy:** Tom's Guide expected to dislike it but was surprised over a 15-mile run — [Tom's Guide](https://www.tomsguide.com/wellness/fitness/i-ran-15-miles-with-the-apple-watchs-new-workout-buddy-heres-my-verdict). Macworld says it "hasn't worked for me like Apple promised" — [Macworld](https://www.macworld.com/article/2888428/ive-been-using-watchos-26-for-months-its-not-ready-for-your-apple-watch.html). T3 asked whether it is "a helpful nudge – or just another gimmick?" — [T3](https://www.t3.com/active/fitness-trackers/apples-workout-buddy-sounds-smart-but-im-not-convinced-itll-actually-help-me-train)
- **Future:** Users can message their coach directly in the app — [Future FAQ](https://www.future.co/faq)

### Inferences
- Default to on-demand chat plus one scheduled proactive message per day. Expose the cadence control the WHOOP user asked for: Off / Important only / After workouts / Daily summary.
- Use positive, strengths-first framing ("You've hit 3 of 4 sessions"), never deficit-first. This matters especially for a teen.
- Ground every AI claim in logged data and show the numbers. Hallucination is the top trust-killer in WHOOP feedback.
- Memory should store temporary context, such as an injury or exam week, and stop coaching on it once resolved, as WHOOP's Memory behaves.

### Gaps
- Tone guidelines from any vendor were not found.

## Onboarding: how they collect profile, goals and equipment quickly

### Takeaway
Fitbod uses a short questionnaire (goal, experience, then equipment set separately). Caliber runs a longer but well-received quiz covering goal, years of experience, workout location, home equipment and session duration. Ladder's quiz routes users to a team. Wearable apps need about one to two weeks of baseline before scores are meaningful.

### Cited Findings
- **Fitbod:** Asks for a goal (e.g., get stronger, lose weight) and an experience level (beginner, intermediate, advanced). Equipment is configured as gym profiles — [Fitbod FAQ](https://fitbod.me/faqs/); [ScreensDesign Fitbod](https://screensdesign.com/showcase/fitbod-gym-fitness-planner)
- **Caliber:** Asks for a goal ("Lose fat," etc.), years of strength training (e.g., "2–5 years"), primary workout location, home equipment (e.g., dumbbells) and workout duration. ScreensDesign describes the quiz as extensive but framed as essential for personalization — [ScreensDesign Caliber](https://screensdesign.com/showcase/caliber-strength-training)
- **Ladder:** A quiz matches users to a coach-led team, which they can change twice a month on PRO or without limit on annual — [Ladder pricing](https://www.joinladder.com/pricing)
- **Oura:** Needs up to two weeks to learn baselines — [Oura Support](https://support.ouraring.com/hc/en-us/articles/4409086524819)
- **Garmin:** Requires a VO2 max estimate, or a week of data on cycling devices, before suggestions appear — [Garmin manual](https://www8.garmin.com/manuals-apac/webhelp/forerunner265series/EN-SG/GUID-D9D7CFDE-ED13-47E7-B817-626C6D6C2887-7792.html)

### Inferences
- With two known users, onboarding can be about five tap-only screens: goal, experience, equipment checklist, minutes per day and days per week, and injuries or limitations. For the teen, add sport, season dates and practice days. Show a first workout immediately, then refine. This avoids the "wait two weeks for baselines" dead zone.

### Gaps
- I could not find screen counts for each app, or any teen or under-18 onboarding or terms. Age minimums and parental consent were not located for any app.

## Apple Health / Watch integrations

### Takeaway
Apple Watch is table stakes for native apps, but watch companions are the most-complained-about surface (Fitbod sync). A PWA cannot run on the watch or read HealthKit directly.

### Cited Findings
- **Fitbod complaints:** Users report phone and watch going out of sync, double-logged workouts, and sets disappearing mid-workout and resetting to 0 — [AppsHunter Fitbod reviews](https://appshunter.io/ios/app/1041517543/reviews/2); [JustUseApp](https://justuseapp.com/en/app/1041517543/fitbod-gym-fitness-planner/reviews)
- **Fitbod:** Has an Apple Health integration — [Fitbod Help: Integrations](https://help.fitbod.me/hc/en-us/sections/35305345636375-Integrations)
- **Gentler Streak:** Automated recovery tracking requires an Apple Watch — [Lifestack](https://lifestack.ai/blog/gentler-streak)
- **Workout Buddy:** Requires an Apple Intelligence–capable iPhone — [Yahoo Tech](https://tech.yahoo.com/wearables/articles/underestimated-workout-buddy-apples-playing-173600647.html)
- **Ladder:** iOS-only — [SensAI Ladder review](https://www.sensai.fit/blog/ladder-app-review-2026)

### Inferences
- PWA workaround (inference, not sourced): manual check-in replaces wearable readiness. Optionally, an iOS Shortcut can export Health data such as sleep or resting HR to the app via URL or clipboard. Users who own an Apple Watch can still close rings by starting a matching Watch workout alongside the PWA session.

### Gaps
- I did not verify current HealthKit or Shortcuts capabilities for web apps in iOS 26.

## Pricing (2025–2026)

### Takeaway
Prices fall into tiers. Algorithmic apps run about $10–16/month (Fitbod, Peloton Strength+, Gentler Streak, Apple Fitness+). Readiness-wearable subscriptions run about $6–30/month. Team or group coaching runs about $19–45/month (Ladder, Caliber Pro). One-on-one human coaching runs about $199/month (Future, Caliber Premium).

### Cited Findings
- **Fitbod:** $15.99/month, $95.99/year per Fitbod's own guide. Other reviews say $79.99/year or $12.99/month. 7-day trial, no free plan (checked Sep 2026) — [Fitbod blog](https://fitbod.me/blog/best-workout-tracker-apps-for-2026/); [AIToolsBakery](https://aitoolsbakery.com/?p=5902). These figures conflict.
- **Future:** $50 for the first month, then $199/month, or $149/month prepaid annually (checked 27 Sep 2026) — [SensAI](https://www.sensai.fit/blog/future-app-review-2026); [Future App Store](https://apps.apple.com/us/app/-/id1288178982)
- **Caliber:** Robust free tier. Caliber Plus from about $72/year includes Strength Score. Pro group coaching about $19/month. Premium one-on-one about $200/month. Sources conflict — [Garage Gym Reviews (snippet)](https://www.garagegymreviews.com/equipment/caliber-strength-training); [BarBend](https://barbend.com/caliber-fitness-app-review/)
- **Ladder:** PRO $29.99/month or $179.99/year with a 7-day free trial. A higher Elite tier is about $44.99/month. A 2024 App Store snapshot listed $199.99 and $499.99 annual — [Ladder pricing](https://www.joinladder.com/pricing); [SensAI](https://www.sensai.fit/blog/ladder-app-review-2026)
- **WHOOP (US):** One about $199/year, Peak about $239/year, Life about $359/year (checked Oct 2026) — [TrackerVS](https://trackervs.com/pricing/whoop-pricing/); [WHOOP membership](https://whoop.com/us/en/membership/)
- **Oura Membership:** $5.99/month or $69.99/year in the US — [Oura Support](https://support.ouraring.com/hc/en-us/articles/4409086524819)
- **Garmin Connect+:** $6.99/month or $69.99/year — [Tom's Guide](https://www.tomsguide.com/wellness/smartwatches/i-tried-garmin-connect-for-a-week-heres-3-things-i-like-and-3-i-dislike)
- **Peloton Strength+:** $9.99/month in the US — [Peloton blog](https://www.onepeloton.com/en-CA/blog/peloton-strength-plus-app)
- **Runna:** $119.99/year, or $149.99/year bundled with Strava — [the5krunner snippet](https://the5krunner.com/2026/09/28/is-runna-ai/)
- **Gentler Streak Premium:** $8.99/month — [Lifestack](https://lifestack.ai/blog/gentler-streak)
- **Apple Fitness+:** Aggregators say $9.99/month or $79.99/year. Mac Observer says Apple publishes no standalone US price, only the Apple One Premier bundle at $39.95/month — [Mac Observer](https://www.macobserver.com/news/fitness-plus-pricing-apple-one-premier/); [FrontDeskReview](https://frontdeskreview.com/software/fitness-apps/apple-fitness-plus/). These sources conflict.

### Inferences
- A personal PWA's cost is mainly LLM API usage. The value bar is about the Fitbod experience, roughly $96/year, plus a chat coach.

### Gaps
- Caliber's current prices are unconfirmed.

## What users praise and complain about

### Takeaway
Users praise personalization grounded in their own data, human accountability (Future, Caliber), and coach-led audio and video (Ladder). They complain about watch sync and rest-timer bugs (Fitbod), repetitive workouts, price (Future), non-individualized team plans (Ladder), AI hallucinations and intrusive proactive messages (WHOOP), shallow AI insights (Garmin), and aggressive progression (Runna).

### Cited Findings
- **Fitbod:** Watch sync failures and lost sets — [AppsHunter](https://appshunter.io/ios/app/1041517543/reviews/2). Rest timer called "beyond annoying" for its time increments, and it vanishes if the user navigates during rest — [AppsHunter p.4](https://appshunter.io/ios/app/1041517543/reviews/4). Slow subscription support — [IndieHackers](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b). Repetitive workouts — [Sikayetvar](https://www.sikayetvar.com/en/fitbod-us/fitbod-gave-me-repetitive-workouts-and-an-unreliable-app-experience)
- **Future:** Rated 4.7/5 overall but 3.5/5 on value — [Active.com](https://www.active.com/fitness/articles/future-app-review). A tester called the price steep but planned to keep paying — [Medical News Today](https://www.medicalnewstoday.com/articles/future-review)
- **Caliber:** Trustpilot reviewers praise their trainers and ease of use; cost is the most common complaint — [Trustpilot](https://www.trustpilot.com/review/caliberstrong.com?page=7)
- **Ladder:** Plans are not individualized per member — [SensAI](https://www.sensai.fit/blog/ladder-app-review-2026). It is recognized as Women's Health 2024 Best Tech and CNET 2024 best strength app — [App Store](https://apps.apple.com/us/app/-/id1502936453)
- **WHOOP AI:** Mixed reviews, with hallucinations and Beta labels — [Gear Patrol](https://www.gearpatrol.com/fitness/whoop-ai-reddit-user-feedback-pros-cons/). Users call the proactive coach intrusive — [WHOOP Community](https://www.community.whoop.com/t/the-new-whoop-coach-feels-very-different-and-not-in-a-good-way/15960)
- **Garmin Connect+:** "Still not worth it after a year" — [the5krunner](https://the5krunner.com/2026/04/20/garmin-connect-plus-review/)
- **Runna:** Injury-risk concerns — [TechRadar](https://www.techradar.com/health-fitness/are-ai-training-apps-like-runna-putting-you-at-risk-of-injury-i-asked-a-real-life-running-coach)
- **Strava's run-coaching app** drew controversy — [AOL/Runner's World syndication](https://www.aol.com/articles/inside-controversy-surrounding-strava-run-162700562.html) (details not retrieved)

### Inferences: patterns to copy and anti-patterns to avoid (adult with short home workouts; teen athlete)
**Copy:**
1. A single "Today" card with a one-line reason tied to the user's own inputs, plus Start (WHOOP Outlook, Fitbod).
2. Weight and reps pre-filled from last session, one-tap set completion, and an auto rest timer stored as an end time (fixes the Fitbod timer pain).
3. Explicit "short on time / not feeling 100% / traveling" toggles that regenerate today (Runna).
4. Equipment profiles: home vs gym vs hotel (Fitbod).
5. Forgiving streaks with pause and per-day goals (Apple watchOS 11), plus a weekly consistency calendar.
6. Morning nudge and evening recap only, with user-selectable proactive cadence (WHOOP community ask).
7. Audio cues for hands-free home sessions (Ladder, Workout Buddy).
8. Coach memory for temporary context that auto-expires (WHOOP Memory).

**Avoid:**
1. Deficit-focused or nagging proactive messages.
2. LLM claims not grounded in logged data, which cause hallucination distrust.
3. Repetitive exercise selection; add variety constraints.
4. Aggressive progression ramps, especially for a teen (Runna controversy). Treat teen load conservatively and defer to sport practice volume.
5. One-size team plans with no individual adjustment (Ladder).
6. Long onboarding before value.
7. Generic AI summaries that restate metrics (Garmin Active Intelligence).

### Gaps
- Few direct Reddit threads were retrievable, and Reddit content was available only via secondary summaries (Gear Patrol).
- No source covered teen-specific features, safeguards or age policies in any of these apps. This is a notable gap for the teen-athlete use case.
- No independent long-term review of Peloton Strength+ or Oura Advisor was found. Their claims come mostly from the vendors.
