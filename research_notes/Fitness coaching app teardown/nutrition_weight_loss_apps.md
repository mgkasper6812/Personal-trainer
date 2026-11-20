# Adaptive Nutrition and Weight-Loss Apps: Competitive Teardown (as of Nov 2026)

Method note: web search only. Direct page fetches were blocked in this session (macrofactor.com, apps.apple.com and amyfoodjournal.com failed DNS under the session network allowlist), so many findings rest on search-result summaries of official pages and of third-party reviews. Many "2026 review" pages are SEO blogs published by competing apps (Nutrola, Nutriscan, Callie, Calorix, PlateLens and others). They are flagged as such, and prices they quote often conflict. Anything marked "prior knowledge" in Inferences was not re-verified in this session.

## Core features of each app (logging methods, adaptive targets, trend smoothing, macro/carb guidance)

### Takeaway
By late 2026 photo/AI logging is table stakes: MacroFactor, MyFitnessPal, Lose It!, Cronometer and Noom all offer it, usually behind the paywall. The real differentiators are (a) adaptive targets driven by a smoothed weight trend (MacroFactor, Carbon) and (b) the quality of the food database. MacroFactor is the clear leader on adaptive-algorithm design. MFP and Lose It! compete on database size and beginner friendliness, and both moved previously free features (barcode scanning, Meal Scan) behind the paywall in 2026.

### Cited Findings
**MacroFactor**
- 2026 annual report: the food-logging AI improved in identification and instruction-following, and the label scanner now reads multiple formats and languages. Planned next: better AI search accuracy and easier food-log editing. — [MacroFactor Annual Report 2026](https://macrofactor.com/annual-report-2026/) (via search summary)
- May 2026 update: the AI tab has two modes, "Snap" (quick photo logging) and "Describe" (one or more photos and/or text). The same update added a Live Activity. Planned: AI-assisted custom food creation. — [MacroFactor May 2026 update](https://macrofactor.com/mm-may-2026/)
- The AI accepts a live photo, a photo plus text, or an uploaded image, and returns editable food and serving estimates before logging. — [Amy Food Journal review 2026](https://www.amyfoodjournal.com/blog/macrofactor-review)
- Conflict: competitor blogs (Nutrola, Bento Bunny) still claim MacroFactor has no AI photo logging or voice logging and call it "text-first, search-first". The official 2026 sources contradict the photo claim. — [Nutrola](https://nutrola.app/en/blog/why-is-macrofactor-so-expensive); [Bento Bunny](https://www.bentobunny.app/reviews/macrofactor-review); [Nutrola Reddit roundup](https://nutrola.app/en/blog/what-do-reddit-users-say-about-macrofactor-2026)
- Adaptive engine: it estimates energy expenditure from how your weight trend responds to logged intake, then sets new calorie and macro targets at each weekly check-in from changes in expenditure, weight and goal. Users can also choose to keep the program steady. — [App Store listing](https://apps.apple.com/app/id1553503471); [Expenditure V3 article](https://macrofactor.com/expenditure-v3/)
- Expenditure V3 is described as more responsive, stable, accurate and resilient to missing data, with fewer and smaller bumps from short-term water-weight swings. — [MacroFactor Expenditure V3](https://macrofactor.com/expenditure-v3/)
- "Adherence neutral": the app "will meet you where you are… without shaming, judgment, or the requirement that you adhere to your targets perfectly". You don't need to hit your macros to get a check-in adjustment. — [MacroFactor dashboard revamp](https://macrofactor.com/dashboard-revamp/); [App Store](https://apps.apple.com/app/id1553503471)

**MyFitnessPal (MFP)**
- MFP acquired Cal AI (announced March 2, 2026; the deal reportedly closed in December 2025). Cal AI remains a separate app with its own subscription. — [Macrolog comparison](https://macrolog.co/compare/cal-ai-vs-myfitnesspal); [Wikipedia](https://en.wikipedia.org/wiki/MyFitnessPal)
- Meal Scan (photo logging) is paywalled. Sources disagree on when it moved behind the paywall (Feb vs May 2026). — [Calorie Tracker Lab](https://calorietrackerlab.com/compare/cal-ai-vs-myfitnesspal-for-photo-scanning-2026/)
- Voice Log is Premium only, English/US only, and searches the same database. It does not support My Foods, My Recipes, My Meals, Quick Add, weight, exercise or water. — [MFP Help: voice logging](https://support.myfitnesspal.com/hc/en-us/articles/30332897072269-How-to-log-food-with-your-voice)
- Premium+ adds personalized meal planning (Meal Planner) and the "Blue Check Collection" (curated recipes). — [MFP 2026 Winter Release press release](https://www.globenewswire.com/news-release/2026/02/24/3243668/0/en/myfitnesspal-debuts-its-2026-winter-release.html)
- One source says MFP is in a reported sale process (unverified). — [askvora](https://askvora.com/blog/myfitnesspal-acquisition-history-what-it-means)

**Lose It!**
- Premium features: barcode scanning (moved to Premium account by account, reported as of Nov 18, 2026), photo and voice logging, intermittent fasting, custom goals, device sync, meal planning, advanced analytics and macro tracking. Free "Basic" keeps a daily calorie budget and a database of about 50M foods. — [SelfMadeNewbie](https://selfmadenewbie.com/lose-it-barcode-scanner/); [Calorix](https://calorix.ai/compare/lose-it-premium-price/)
- Accuracy rated lower than competitors in one self-run test (about ±12.4% MAPE; methodology is the site's own). — [Callie/Reddit roundup](https://www.mycallie.app/en/blog/best-calorie-tracker-app-reddit)

**Cronometer**
- Free tier: food logging, barcode scanning, 84 tracked nutrients, device syncing, with ads. Gold adds no ads, Photo Log, Voice Log, Macro Scheduler, Fasting Timer, Custom Charts and Repeat Items. — [Calorix](https://calorix.ai/compare/cronometer-price/)
- Photo logging appeared as a beta in early 2026. Earlier-2026 articles saying Cronometer has no AI photo or voice logging are now outdated. — [Nutrola Cronometer Gold](https://nutrola.app/en/blog/is-cronometer-gold-worth-it-2026)

**Noom**
- The core product is a behavior-change, psychology-lesson program. Its color-coded food system (green/yellow/orange by calorie density) has been criticized by experts as possibly contributing to disordered thinking (Insider, cited by Yahoo). — [Yahoo / Noom settlement article](https://sports.yahoo.com/noom-settles-billing-lawsuit-62-203622467.html)
- "Welli" is an AI health assistant that helps users log food. Welli-powered personal meal plans are built in (some details come from an older press release). — [Nutrition & Nourishment Collective](https://www.nutritionnc.com/glp-1/reviews/noom/)
- The GLP-1 Companion offers med tracking and dosing, individualized protein and macro targets, photo-based meal logging, "Muscle Defense" workouts and an "AI Body Scan". A free version launched June 24, 2026 inside the regular Noom app. — [Noom GLP-1 Companion](https://www.noom.com/med/glp1-companion/); [GlobeNewswire Jun 2026](https://www.globenewswire.com/news-release/2026/06/24/3316992/0/en/noom-launches-free-version-of-its-powerful-glp-1-companion-empowering-providers-with-a-research-backed-tool-to-support-weight-loss-that-lasts.html)

**Carbon Diet Coach**
- Sets macro targets for fat loss, muscle gain, maintenance or reverse dieting and adjusts them weekly. Reviews disagree on whether it has a barcode scanner. It tracks a small nutrient set and is aimed at physique athletes and strength trainees. Rated 4.8 from 14k+ ratings. — [joincarbon.com](https://www.joincarbon.com/); [FeastGood comparison](https://feastgood.com/macrofactor-vs-carbon-diet-coach/)

**Happy Scale (weight-trend only)**
- Uses moving-average "mathematical analysis" of scale weights to cut through daily fluctuations. It is not a calorie tracker and optionally integrates with Apple Health. Requires iOS 16+. — [App Store: Happy Scale](https://apps.apple.com/us/app/happy-scale/id532430574)

**CGM apps**
- Abbott Lingo: an over-the-counter sensor plus app that turns glucose into a "Lingo Count" to help spot and reduce spikes. Adults 18+, no prescription. Levels: a data and analysis platform (food scores, trends) using Dexcom Stelo/G7 or Libre, with AI-driven rather than human coaching. Nutrisense: CGM plus a 1:1 dietitian. All are cash-pay wellness tools, not diabetes treatment. — [Vitality Scout](https://vitalityscout.com/guides/cgm-without-diabetes); [BetterVitals](https://www.bettervitals.com/learn/levels-health-alternatives-2026); [knowledgelib](https://knowledgelib.io/fitness/wearables/continuous-glucose-monitors/2026)

### Inferences
- The adaptive engine plus weight-trend smoothing (MacroFactor, Carbon, Happy Scale) is the feature to copy. Photo and voice logging alone are no longer a moat.
- MFP's voice logging is a thin layer over database search (no Quick Add, no saved meals). A natural-language logger that understands "same as last night's snack" or "handful of almonds and a beer" would beat it.
- Prior knowledge (not re-verified): MacroFactor also shows a micronutrient view, lets users choose coaching modes ("Coached", "Collaborative", "Manual"), and launched a separate MacroFactor Workouts app in 2025.

### Gaps
- I could not fetch the MacroFactor knowledge base to confirm exact check-in math, macro programs (balanced, low-carb, low-fat, keto) or the coaching-mode names for 2026.
- Lose It! and Cronometer carb-quality and glycemic features (glycemic load, net carbs, fiber targets) were not verified. Cronometer is known for net-carbs and fiber tracking (prior knowledge).

## Daily-use UX: dashboard, taps-to-log, check-ins, charts, notifications, streaks

### Takeaway
Home-screen changes are high-risk. MFP's 2026 replacement of the Diary with a "Today" screen caused a user revolt and a rating crash, the clearest anti-pattern in the category. MacroFactor's weekly check-in plus Live Activity, and Lose It!'s gamified streaks and calorie budget, are the patterns users reward.

### Cited Findings
- MFP v26.16.0 (spring 2026) replaced the Diary tab with a "Today" home screen and a new "Progress" tab, pitched as "fewer taps". The rating reportedly dropped from 3.24 to 1.54 stars. Users said the new layout increased taps for core logging. The help center says the logging screens themselves were unchanged. — [mwm.ai](https://mwm.ai/articles/myfitnesspal-v26-16-0-replaces-diary-with-new-ui-sparking-rating-drop-in-april-2026); [Callie](https://www.mycallie.app/en/blog/myfitnesspal-new-update-today-screen); [MFP Winter Release](https://www.globenewswire.com/news-release/2026/02/24/3243668/0/en/myfitnesspal-debuts-its-2026-winter-release.html)
- MacroFactor's May 2026 update added a Live Activity (iOS lock screen / Dynamic Island) alongside the food-logging upgrade. — [MacroFactor May 2026](https://macrofactor.com/mm-may-2026/)
- MacroFactor's weekly check-in generates new calorie and macro targets. Its dashboard revamp positioned the dashboard around targets, weight trend and expenditure. — [MacroFactor dashboard revamp](https://macrofactor.com/dashboard-revamp/)
- MacroFactor's most-praised UX element: it "turns noisy day-to-day weigh-ins into a usable trend". Main friction points: learning curve and cost. — [Macaron Reddit summary](https://macaron.im/playbook/macrofactor-reddit)
- Lose It! is reviewed as a "gamified calorie tracker that keeps you coming back" (streaks, badges, calorie budget). — [Gaya review 2026](https://www.trygaya.com/review/lose-it-review)
- Happy Scale users praise seeing an average instead of a single weigh-in. One user complained the moving average "smooths it out too well" and wanted to pin a start date. — [App Store: Happy Scale](https://apps.apple.com/us/app/happy-scale/id532430574)

### Inferences
- Copy: a lock-screen or Watch glance with "calories/carbs left tonight", plus a single weekly check-in moment where the plan changes. Daily noise stays hidden behind the trend.
- Avoid: forced home-screen redesigns that move the core logging entry point. Ship big UI changes as opt-in first.
- Prior knowledge (unverified this session): MacroFactor deliberately avoids streaks and red "over budget" colors (consistent with "adherence neutral"), while MFP and Lose It! use streaks and red over-budget states.

### Gaps
- No verified tap counts per app. No verified notification and reminder settings for any app in 2026.

## Coaching approach: algorithmic vs human vs AI chat vs psychology; plateaus and "bad days"

### Takeaway
There are four models. MacroFactor and Carbon use an algorithm with a weekly check-in and handle plateaus by re-estimating expenditure. Noom uses psychology lessons plus human/AI coaching, and has pivoted heavily to GLP-1 medication. Omada and Virta run clinical programs with human coaches. Lingo, Levels and Nutrisense are glucose-feedback apps. For "bad days", MacroFactor's adherence-neutral, no-shame design is the most user-praised pattern.

### Cited Findings
- MacroFactor is "adherence neutral": no shaming, and imperfect adherence still yields sensible adjustments. — [MacroFactor](https://macrofactor.com/dashboard-revamp/)
- Expenditure V3 resists water-weight swings and missing data, so plateaus are interpreted from the trend, not daily weigh-ins. — [Expenditure V3](https://macrofactor.com/expenditure-v3/)
- Noom has bundled behavioral coaching with compounded GLP-1 medication in Noom Med. The Microdose tier caps dosing (reported 0.6 mg). — [MenoMellow](https://www.menomellow.com/reviews/noom/); [TheDoseReport](https://thedosereport.com/noom-review/)
- Omada Prevent (prediabetes) is built on the NIH DPP trial. It provides CDC/DTTAC-certified health coaches, condition-specific peer groups and virtual physician visits, and is a 16-week program in at least one employer plan. Omada reports 58% of participants reached normal A1C at 12 months (company data). — [Omada Prediabetes](https://www.omadahealth.com/prediabetes); [Quest](https://www.questdiagnostics.com/business-solutions/employers/population-health/virtual-care/chronic-disease-prevention-omada)
- Virta's prediabetes program uses carbohydrate-restriction nutrition therapy, continuous remote care, telehealth and a dedicated health coach via app. Virta-reported 2-year data: 97% avoided progression to T2D and 52% achieved prediabetes reversal (2021, company data). — [Virta](https://www.virtahealth.com/blog/virta-health-reversal-treatment-prediabetes); [diaTribe](https://diatribe.org/diabetes-medications/better-health-possible-through-virtas-prediabetes-obesity-and-type-2-diabetes)
- Nutrisense pairs a CGM with a 1:1 dietitian. Levels has no human coaching (AI-driven). — [knowledgelib](https://knowledgelib.io/fitness/wearables/continuous-glucose-monitors/2026)

### Inferences
- For a pre-diabetic dad, the strongest evidence base is the DPP model (weekly lessons, coach contact, 5–7% weight-loss goal, activity minutes). An AI coach can deliver DPP-style curriculum at scale while using MacroFactor-style math for targets.
- Plateau handling should explain the trend ("water retention after salty dinner; the trend is still down 0.4 lb/week") rather than cut calories reactively.

### Gaps
- No verified 2026 detail on how Noom's lessons or AI coach handle relapses. No verified details of the Noom human-coach model in 2026.

## Evening snacking / habit change, and pre-diabetes / blood sugar features

### Takeaway
None of the leading trackers has a verified, dedicated feature for evening or TV snacking. This is a clear white space. Blood-sugar features exist only in CGM apps (Lingo, Levels, Nutrisense) and clinical programs (Omada, Virta). Mainstream trackers at most read glucose from Apple Health.

### Cited Findings
- Searches for Noom night-snacking features returned nothing specific. — [search via Noom GLP-1 coverage](https://www.noom.com/med/glp1-companion/)
- Lose It! reads blood glucose (plus blood pressure, BMI and body fat) from Apple Health. No direct Dexcom integration was found. — [Lose It! Help: Apple Health](https://loseit.zendesk.com/hc/en-us/articles/47773580085140-Using-Apple-Health-With-Lose-It)
- Lingo's "Lingo Count" gamifies spike reduction. Levels gives food scores. All CGM products are cash-pay wellness tools, not designed for prediabetes treatment. — [Vitality Scout](https://vitalityscout.com/guides/cgm-without-diabetes); [knowledgelib](https://knowledgelib.io/fitness/wearables/continuous-glucose-monitors/2026)
- About 115.2 million US adults have prediabetes (CDC 2026 fact sheet). — [CDC National DPP (Spanish PDF, 2026)](https://www.cdc.gov/diabetes/media/pdfs/2026/03/National-DPP-spanish-pdf.pdf)
- Virtual DPP providers such as Omada can serve Medicare. — [Fierce Healthcare](https://www.fiercehealthcare.com/digital-health/virtual-diabetes-prevention-programs-secure-medicare-coverage)
- Lose It! (Premium), Cronometer (Gold) and Noom offer fasting timers. — [Calorix Cronometer](https://calorix.ai/compare/cronometer-price/); [SelfMadeNewbie](https://selfmadenewbie.com/lose-it-barcode-scanner/)

### Inferences
- Opportunity: "kitchen closed" time windows (a fasting timer reframed around evenings), a pre-planned evening snack budget, contextual nudges around the user's TV time (e.g., Apple Watch haptic at 8:30 pm), "swap" suggestions (protein or high-fiber snacks), and a no-shame log of urges vs actual snacks.
- Pre-diabetes features to build: carb-quality scoring (fiber, added sugar), post-dinner walk prompts (short home sessions fit), and optional CGM import via Apple Health (Lingo and Stelo write to Health; prior knowledge, unverified) to show "this snack spiked you vs that one".

### Gaps
- No verified data on whether MacroFactor, MFP or Cronometer offer glycemic index/load guidance in 2026.
- Reddit r/loseit threads on evening snacking were not directly retrieved.

## Integrations: Apple Health, smart scales, Apple Watch

### Takeaway
Apple Health is universal. Smart-scale sync usually flows through Apple Health, or through a paid direct integration (Lose It! Premium for Withings). Apple Watch support is uneven, and I could not confirm whether MacroFactor has a Watch app.

### Cited Findings
- Lose It!: Apple Health sync for all iOS users (weight, food, exercise, glucose, BP, body fat). Withings scale sync is reportedly Premium. Its Watch app shows calorie budget and Calorie Bonus (free). — [Lose It! Help](https://loseit.zendesk.com/hc/en-us/articles/47773580085140-Using-Apple-Health-With-Lose-It); [Nutriscan comparison](https://nutriscan.app/blog/posts/lose-it-vs-mynetdiary-2026-calorie-tracking-fitness-sync-9794efd2bf)
- Happy Scale optionally integrates with Apple Health. — [App Store](https://apps.apple.com/us/app/happy-scale/id532430574)
- MacroFactor: Live Activity added May 2026. Searches turned up no confirmation of an Apple Watch app. — [MacroFactor May 2026](https://macrofactor.com/mm-may-2026/)
- MFP: no 2026 source found on Apple Watch features.

### Inferences
- A lightweight weight-in flow (scale → Apple Health → app trend) plus Watch complications for calories and carbs left is a differentiator for the target user. Make it a free-tier feature.

### Gaps
- MacroFactor, MFP and Cronometer Apple Watch status in 2026 unverified.

## Pricing (2025–2026, US)

### Takeaway
Paid tiers have converged around $60–$100 per year, and 2026 saw aggressive paywalling of formerly free features (Lose It! barcode scanning, MFP Meal Scan). Noom's coaching app is opaque and quiz-priced. Medical programs (Noom Med, Virta, Nutrisense) run $180–$300/month or are covered by employers or insurers.

### Cited Findings
- MacroFactor: $11.99/mo, $47.99 per 6 months, $71.99/yr. No free tier; 7-day trial. — [Nutriscan](https://nutriscan.app/blog/posts/macrofactor-cost-2026-free-version-29f5edc98b); [Mealift](https://www.mealift.app/blog/macrofactor-review)
- MyFitnessPal: Premium $79.99/yr (about $19.99/mo in-app). Premium+ $99.99/yr. — [MFP Winter Release](https://www.globenewswire.com/news-release/2026/02/24/3243668/0/en/myfitnesspal-debuts-its-2026-winter-release.html)
- Lose It!: Premium $79.99/yr (up from $39.99 earlier in 2026). Lifetime $299.99 ($229.99 for current Premium members). 7-day trial. — [Calorix](https://calorix.ai/compare/lose-it-premium-price/); [Nutrient-metrics analysis](https://nutrient-metrics.com/en/guides/lose-it-price-increase-analysis/)
- Cronometer Gold: $59.99/yr or $10.99/mo. Earlier 2026 sources cite $49.99/yr. — [Calorix](https://calorix.ai/compare/cronometer-price/)
- Carbon: $11.99/mo, $59.99 per 6 months, $99.99/yr (official site). Third-party sites cite other numbers. — [joincarbon.com](https://www.joincarbon.com/)
- Happy Scale+: $1.99/mo, $11.99/yr, $39.99 lifetime. — [App Store](https://apps.apple.com/us/app/happy-scale/id532430574)
- Noom (core app): quiz-dependent pricing, typically around $200 for a multi-month term (self-reported). Noom Med: Microdose $79 for the first 4 weeks then $179/mo billed every 12 weeks (checked Sept 29, 2026). Semaglutide $129 then $279/mo (July 2026). Compounded tirzepatide $149 then $299/mo. — [Unstar](https://unstar.app/blog/noom-cost-charged-after-cancelling-refund-reviews-2026); [GLP1 Authority](https://www.glp1authority.com/noom-review/); [Ozari Health](https://www.ozarihealth.com/blog/noom-med-pricing-review)
- Cal AI (MFP-owned): about $9.99/mo or $79/yr (conflicting sources). — [eesel](https://www.eesel.ai/blog/cal-ai-pricing)
- Lingo from $49–54 for a 2-week starter, about $84–89 per 4 weeks. Levels membership $80–199/yr plus sensors. Nutrisense about $179–399/mo. — [Vitality Scout](https://vitalityscout.com/guides/cgm-without-diabetes); [BetterVitals](https://www.bettervitals.com/learn/levels-health-alternatives-2026)
- Virta self-pay was historically $249/mo in year 1 plus a $250 initiation fee (older data). It is usually employer/plan covered. From July 1, 2026, Maine's state plan requires Virta enrollment for GLP-1 weight-loss coverage. — [Maine.gov](https://www.maine.gov/bhr/oeh/virtahealth); [healthywayfit](https://www.healthywayfit.com/blog/omada-alternatives/)
- Omada: offered through employers, insurers and Medicare. No consumer price. — [Omada](https://www.omadahealth.com/prediabetes)

### Inferences
- A $60–80/yr consumer price is the market anchor. An AI coach can charge a premium only if it clearly replaces human coaching or bundles CGM insights.

### Gaps
- Official MacroFactor and Noom price pages not fetched. Several prices come from competitor blogs.

## User praise and complaints

### Takeaway
Praise centers on trustworthy adaptive math (MacroFactor), database breadth (MFP) and beginner-friendliness and gamification (Lose It!), plus accuracy and micronutrients (Cronometer). Complaints center on paywall creep (MFP, Lose It!), forced redesigns (MFP), price and learning curve (MacroFactor), and predatory billing (Noom).

### Cited Findings
- MacroFactor: most recommended by Reddit's experienced trackers. Praise for adaptive targets and trend smoothing. Complaints: subscription cost, learning curve, database gaps outside the US. Top score (4.47) in a June 2026 user-sentiment scorecard (published by competitor MyNetDiary). — [TrackerBenchmark](https://trackerbenchmark.com/bestof/reddit-best-calorie-tracker-2026/); [Macaron](https://macaron.im/playbook/macrofactor-reviews); [MyNetDiary scorecard](https://www.mynetdiary.com/diet-app-scorecard-june-2026.html)
- MyFitnessPal: "most-mentioned, decreasingly recommended". The May 2026 paywall hurt its reputation. The database is its strength, especially for eating out. Accuracy complaints about user-generated entries. The Today-screen redesign crashed ratings. — [Calorie Tracker Lab](https://calorietrackerlab.com/articles/reddit-best-calorie-tracker-2026/); [mwm.ai](https://mwm.ai/articles/myfitnesspal-v26-16-0-replaces-diary-with-new-ui-sparking-rating-drop-in-april-2026)
- Lose It!: recommended for beginners. Backlash over barcode scanning going Premium and the price doubling to $79.99. — [SelfMadeNewbie](https://selfmadenewbie.com/lose-it-barcode-scanner/); [Sunrise Digest](https://thesunrisedigest.com/eat/lose-it-review-2026/)
- Cronometer: praised for accuracy and micronutrients. — [Calorie Tracker Lab](https://calorietrackerlab.com/articles/reddit-best-calorie-tracker-2026/)
- Noom: in 2025 it settled a class action for $56M cash plus $6M credits over trial-to-subscription and cancellation practices ("difficult by design"). The BBB had logged 1,185 complaints in one year (rating "D"). ConsumerAffairs reviews from Feb–Oct 2026 still report charges after cancelling. — [Yahoo](https://sports.yahoo.com/noom-settles-billing-lawsuit-62-203622467.html); [ABC7](https://abc7chicago.com/noom-better-business-bureau-weight-loss-covid-19/7422874/); [ConsumerAffairs](https://www.consumeraffairs.com/health/noom.html?page=2)
- Happy Scale: loved for trend clarity. Its limit is that it doesn't count calories. — [App Store](https://apps.apple.com/us/app/happy-scale/id532430574)

### Inferences — patterns to copy vs avoid
- COPY: MacroFactor's adherence-neutral weekly check-in, a smoothed trend as the hero metric, editable AI estimates before saving, and Live Activity / lock-screen glances.
- COPY: Lose It!'s Watch calorie-budget glance, light gamification, and Apple Health as the hub for scale and CGM data.
- COPY: DPP structure (Omada) for pre-diabetes: weekly lessons, a 5–7% weight-loss goal, activity minutes, and a coach touchpoint.
- AVOID: paywalling core logging after users depend on it (Lose It! barcode scanning, MFP Meal Scan), opaque quiz-based pricing and hard cancellation (Noom), forced home-screen redesigns (MFP v26.16), and moralizing food colors (Noom's critique).

### Gaps
- No direct Reddit or App Store review text was retrieved, since fetches were blocked. Sentiment comes from aggregator summaries, several written by competing apps.
