# Softball Hitting-Development Tech & Apps — Competitive Teardown (as of Nov 2026)

Method note: This session's network blocked direct page fetches (blastmotion.com, apps.apple.com, commitbound.com failed DNS), so everything below comes from web-search result snippets and summaries, not full-page reads. Numbers should be spot-checked against the live pages before they're used in product copy. No Reddit threads surfaced in search. Player and parent sentiment comes from Google Play, Amazon, App Store snippets, and the DiscussFastpitch forum.

## 1. Which metrics matter, and fastpitch benchmarks (HS and college recruit)

### Takeaway
For a HS fastpitch hitter, the core "engine" metrics are bat speed, time to contact (TTC), and rotational acceleration, plus exit velocity (EV) as the output metric. Plane and connection metrics (attack angle, on-plane efficiency, connection) serve as quality checks. Blast's softball bat-speed table (HS varsity 49–63 mph; 16U–18U travel 54–66; college 58–70) is the most-cited benchmark, but Blast's own pages contradict each other. Recruiting EV and speed standards come mostly from vendor and recruiting-service blogs, and they disagree.

### Cited Findings
**Bat speed (Blast, softball)**
- Blast's softball bat-speed ranges (said to draw on 400M+ swings in its database): HS JV 42–56 mph, HS varsity 49–63, travel 16U–18U 54–66, college 58–70, pro 63–75 — [Blast: Softball Bat Speed by Age](https://blastmotion.com/blog/softball-bat-speed-by-age-youth-to-college-benchmarks/); [Blast Connect softball metrics](https://blastconnect.com/training_center/softball/metrics/softball-swing)
- Conflicting Blast figures: another Blast post lists HS at 51–61 mph and college at 57–66. The Blast FAQ says college players "typically swing 66–75 mph," which looks like a baseball-style number — [Blast FAQ](https://blastmotion.com/faq/); [Blast: What Does Blast Measure](https://blastmotion.com/blog/what-does-blast-motion-measure/)
- Blast says varsity-level hitters should target On-Plane Efficiency (OPE) above 70%. At the college level it stresses rotational acceleration and connection at impact near 90° — [Blast: Softball Bat Speed by Age](https://blastmotion.com/blog/softball-bat-speed-by-age-youth-to-college-benchmarks/)

**Time to contact, plane, connection, power (Blast softball)**
- Softball TTC (start of downswing to impact): youth and 12U–14U 0.16–0.22 s; HS and 16U–18U 0.16–0.19 s; college and pro 0.15–0.18 s — [Blast Softball product page](https://blastmotion.com/products/softball/); [Blast: What Is Time to Contact](https://blastmotion.com/blog/what-is-time-to-contact-in-softball-hitting/)
- Connection targets: Early Connection 80–105°, Connection at Impact 80–95°, with an ideal around 90°. OPE target is 70% or higher, within a 65–85% range — [Blast Softball product page](https://blastmotion.com/products/softball/); [Blast Softball metric definitions](https://blastmotion.com/support/softball/metric-definitions/)
- Attack angle: the product page gives level-specific ranges (about -2° to 15° for youth/12U–14U, 3° to 15° for pro), while a separate Blast article gives one target of +4° to +12°. These conflict — [Blast Softball product page](https://blastmotion.com/products/softball/); [Blast: Softball Swing Mechanics](https://blastmotion.com/blog/softball-swing-mechanics/)
- Softball power is reported in kW (for example, 1.07–1.89 kW for 12U–14U and 2.10–2.90 kW for pro) — [Blast Softball product page](https://blastmotion.com/products/softball/)
- Plane Score and Connection Score use the 20–80 scouting scale and are relative to the player's level. Plane Score is derived from OPE. Connection Score combines Early Connection and Connection at Impact — [Blast Softball manual (Manula)](https://www.manula.com/manuals/blast-motion/blast-softball-5-0/1/en/topic/metrics); [Blast metric definitions](https://blastmotion.com/support/softball/metric-definitions/)
- A FanGraphs community analysis of Blast data found TTC and attack angle among the stronger predictors of wOBA. It covered baseball and used older Blast metrics — [FanGraphs Community](https://community.fangraphs.com/blast-motion-sensor-correlation-to-on-field-performance-and-how-to-utilize-it/)
- A 2022 study in *Sports* found knob-mounted sensors measure bat speed reliably but measure swing angles less precisely (cited via search summary) — [Blast: What Does Blast Measure](https://blastmotion.com/blog/what-does-blast-motion-measure/)

**Diamond Kinetics metric definitions**
- DK "Max Barrel Speed" is measured at a point 20% from the tip of the bat. "Max Hand Speed" is peak hand speed. "Trigger to Impact" is the time in ms from the start of forward bat motion to impact (DK's equivalent of TTC). "Max Acceleration" is how quickly the swing speeds up from start to impact — [DK SwingTracker Softball science: speed](https://diamondkinetics.com/support/swingtracker-softball/science/speed)
- Other DK metrics: Applied Power, Impact Momentum, Approach Angle, Speed Efficiency, Hand Cast Distance, Distance in the Zone, Hand Path — [Team Facts Recruiting DK review](https://teamfactsrecruiting.com/diamond-kinetics-review/); [Amazon DK Softball Bundle](https://www.amazon.com/Diamond-Kinetics-Softball-Bundle/dp/B07QM9PLJ8)

**Exit velocity (recruiting)**
- Blast says it has not published age-specific softball EV benchmarks and recommends tracking bat speed by level instead — [Blast: Softball Exit Velocity by Age](https://blastmotion.com/blog/softball-exit-velocity-by-age/)
- Tee EV for D1: one chart gives about 68–72 mph for mid-major and 75+ mph for Power 4 elite. Another source says 65+ mph for D1. A third says 70–80+ mph — [CommitBound recruiting standards](https://commitbound.com/softball/recruiting-standards); [CommitBound EV chart](https://commitbound.com/softball/exit-velocity-chart); [NextCommit guide](https://www.nextcommit.ai/blog/how-to-get-recruited-for-college-softball); [Pathley standards](https://www.pathley.ai/blog-posts/softball-recruiting-standards-guide)
- A third-party calculator puts HS EV at 60–75 mph and college at 65–80+ mph — [Dugout Edge EV calculator](https://www.dugoutedge.com/softball-exit-velocity-calculator)
- A claim that D1 wants "90+ mph" EV for position players appears to be a baseball figure that bled into softball content. Disregard it — [NextCommit softball recruiting](https://www.nextcommit.ai/softball-recruiting)
- One coach reports a college team's average bat speed rising from about 55 to about 66 mph over one fall season (anecdotal) — [Hitting with Torque](https://torque-hitting.com/2024/11/02/how-fast-is-your-baseball-softball-swing/)

### Inferences
- For a class-of-2028 hitter (a junior in 2026–27), a sensible app ladder is: get from the HS-varsity band into the 16U–18U travel band (54–66 mph bat speed), then aim for the college band (58–70). For EV, the tiers are a tee EV of 65 mph (minimum D1 per some sources), then 70 mph, then 75+ mph (P4).
- Benchmarks conflict even within one vendor. An app that shows ranges should cite its source and level definition, and it shouldn't present any one number as the "standard."
- Blast's TTC and DK's Trigger-to-Impact measure similar things but differently, and Blast bat speed and DK barrel speed don't share a measurement point. Treat cross-device numbers as non-comparable.

### Gaps
- No softball-specific peak hand speed or rotational acceleration benchmark tables were retrieved (Blast pages could not be fetched).
- No independent (non-vendor) fastpitch EV norms from NFCA or NCAA programs were found. Extra Inning Softball and Fastpitch TV did not appear in results.

## 2. How the apps present sessions, drills, goals, progress, leaderboards, video, and sharing

### Takeaway
Sensor apps (Blast, DK) are built around a per-swing metric card plus auto-clipped video synced to impact, with session history, trend charts, and level-based comparisons. Coaching layers (Blast Connect, Driveline TRAQ) add assigned drills, video markup, chat, and roster or team dashboards. Gamification shows up in DK's virtual games. Most history and trend features sit behind a paywall.

### Cited Findings
- **Blast Softball app:** Smart Video Capture finds swings automatically, clips them, and overlays metrics synced at impact. Users praise the slow-down at contact synced with metrics — [Blast Softball App Store](https://apps.apple.com/us/app/id1228437292)
- **Blast Connect Mobile (coach side):** coaches review practice sessions, assign drills and workouts, and give remote feedback with video markup and voiceover — [Blast Connect Mobile App Store](https://apps.apple.com/us/app/id1228912029)
- **Blast Connect web:** data trending, advanced reporting, roster management, and mobile video analysis. A Team Admin app handles sensor assignment and bulk uploads from multiple sensors — [Blast Softball Team Admin](https://apps.apple.com/app/id1391863117); [Blast Connect Mobile](https://apps.apple.com/us/app/-/id1228912029)
- **Blast scores** turn raw metrics into Plane, Connection, and Rotation scores on the 20–80 scouting scale, relative to playing level — [Blast metric definitions](https://blastmotion.com/support/softball/metric-definitions/)
- **Diamond Kinetics:** 3D view of swing plane and path synced with metrics, two-swing comparison, and age-group benchmark comparisons. Three virtual games: Barrel Speed Climber, Home Run Derby, and Trigger to Impact. The sensor stores up to 128 swings offline — [DK Virtual Games help](https://help.diamondkinetics.com/hc/en-us/articles/13078919100951-Virtual-Games); [Hitting Store SwingTracker](https://www.hittingstore.com/products/swingtracker)
- DK history: access to past sessions reportedly requires the premium subscription (claim from a competitor, Blast) — [Blast vs DK comparison](https://blastmotion.com/blog/blast-motion-vs-diamond-kinetics-comparison/)
- A competitor (Blast) says DK content skews toward MLB comparisons rather than softball-specific benchmarks. This is a vendor-biased claim — [Blast vs DK](https://blastmotion.com/blog/blast-motion-vs-diamond-kinetics-comparison/)
- **Driveline TRAQ:** shows throwing, hitting, and strength data side by side, with daily readiness logging (sleep, nutrition, well-being). Online hitters get a TRAQ profile with video upload, direct communication with trainers (TraqChat), and tracked performance results. Plans are daily, with custom drills, sets, reps, and goals — [Why We Created TRAQ](https://www.drivelinebaseball.com/2018/12/why-we-created-traq/); [Driveline remote hitting help](https://help.drivelinebaseball.com/portal/en/kb/articles/what-are-my-remote-training-options-with-driveline-as-a-hitter); [Online Hitting experience](https://drivelinebaseball.com/2021/06/online-hitting)
- **Pocket Radar Sports App (with Smart Coach):** remote control, a wireless display on the phone, audio speed call-outs, speed embedded in video, slow-mo, and CSV export. It can push velocities into streaming and scoring apps — [Pocket Radar Smart Coach](https://www.pocketradar.com/products/smart-coach-radar); [Fastpitcher review](https://fastpitcher.com/softball/pocket-radar-review-smart-coach/)
- **HitTrax:** EV, launch angle, distance, and point of impact. Comparison articles describe it as leaning toward gaming and entertainment (simulated games, facility leaderboards), while Rapsodo is the more data-focused, portable option — [R3 / LI Diamond: Rapsodo vs HitTrax](https://www.lidiamondbaseball.com/rapsodo-pro-2-vs-hittrax/)
- **Rapsodo PRO 2.0:** dual sport (baseball and softball), 20+ hitting and pitching metrics. Player profiles sit behind a paywall — [Rapsodo PRO 2.0](https://rapsodo.com/products/pro-2-dual-baseball-softball-flight-monitor); [Bat Digest Rapsodo review](https://batdigest.com/blog/rapsodo-review/)

### Inferences
- Patterns worth copying:
  - Impact-synced video with a metric overlay.
  - 20–80 scores normalized to level, which are easier for parents than raw degrees.
  - Coach assigning drills with voice and markup feedback.
  - Daily readiness logging beside the training data, as TRAQ does.
  - Gamified single-metric challenges, such as DK's "Barrel Speed Climber."
  - Audio call-outs of each speed reading, which help during solo or parent-run sessions.
- Leaderboards are mostly facility-level (HitTrax). Sensor apps lean on benchmark bands instead of social ranking, which is a better fit for a single athlete's app.

### Gaps
- Could not confirm whether the Blast Softball app currently has structured training plans, challenges, or leaderboards (product pages were blocked).
- No detail was retrieved on the "DK Hitting" or newer DK app redesign UI.

## 3. Structured programs: volume and intent progression, overload/underload, testing cadence

### Takeaway
Commercial programs follow similar patterns: off-season blocks of 4–12 weeks, 3–4 days a week, max-intent swings, ±20% weighted bats, and testing at the start and end of each block. The peer-reviewed evidence for weighted-bat bat-speed gains in softball is weak or mixed. The strongest positive claims come from vendors.

### Cited Findings
- **The Hitting Vault Bat Speed Program:** a 6–12 week off-season block, 3–4 days a week, full-effort reps, built heavily on overload and underload. Members only — [Hitting Vault bat speed program](https://thehittingvault.com/bat-speed-training-program/)
- **Driveline / Axe implements:** a 20% overload, 20% underload standard. Driveline's set has two +20% overload bats (one handle-loaded, one end-loaded) and one −20% underload bat. Driveline claims improvements in bat speed and barrel control and cites 6-week results — [Driveline: weighted bat training](https://www.drivelinebaseball.com/2017/01/training-hitters-overload-underload-implements/); [Driveline Bat Speed Trainers guide](https://drivelinebaseball.com/blogs/blog/the-complete-guide-to-driveline-bat-speed-trainers)
- **Axe Fastpitch Speed Trainers (L179G):** handle-loaded and barrel-loaded +20% bats, with 24 weeks of guided training (12 weeks in-season and 12 weeks off-season) created by Driveline — [JustBats L179G](https://www.justbats.com/product/axe-speed-training-fastpitch-softball-bats-2-pk--l179g/31061/); [Walmart Axe fastpitch](https://www.walmart.com/ip/Axe-Bat-Fastpitch-Softball-Speed-Trainers-20-Barrel-Load-20-Handle-Load-2-1-4-Barrel-Program-by-Driveline-Baseball-34/836090844)
- Axe marketing claims "5+ mph in exit speed, on average." A Driveline-affiliated facility advertises a 15-day program averaging 3–5 mph EV gains. Both are promotional, with no published methodology — [Axe Speed Trainers](https://axebat.com/products/axe-bat-speed-trainers-powered-by-driveline-baseball-2); [Diamond Performance CT](https://www.diamondperformancect.com/driveline-hitting)
- Bat Digest's sample overload/underload schedule uses 150 total swings per block, sequencing heavy, then light, then normal bats, over 12 weeks. It is research-style, not Axe's official plan — [Bat Digest: underload/overload bats](https://batdigest.com/blog/underload-overload-bats-weighted-bat-training/)
- **Evidence:** Szymanski et al. (2001, MSSE abstract) trained 18 college softball players for 4 weeks with balanced or end-weighted bats. Neither condition increased hand or bat velocity with the natural bat — [Coaches' Infoservice summary](https://coachsci.sdsu.edu/csa/vol85/szymansk.htm)
- A 1996 study of 60 university baseball players found significant bat-speed gains in all groups and suggested varied loads may drive adaptation — [BISp: weighted bat implement training](https://www.bisp-surf.de/Record/PU199603106340)
- A female softball study found swing kinematics were not altered by warming up with differently weighted bats before max swings — [Konstanz / ISBS proceedings](https://ojs.ub.uni-konstanz.de/cpa/article/view/6465/5832)
- All About Fastpitch recommends off-season dry swings at max intent and high-intent short-toss rounds, and says structured multi-season work gives the largest gains — [All About Fastpitch](https://www.allaboutfastpitch.com/how-to-increase-bat-speed-in-softball/)
- Driveline online hitting programs typically run in roughly 4-week cycles, with retesting and video review in TRAQ — [Driveline Online Hitting](https://drivelinebaseball.com/2021/06/online-hitting)

### Inferences
- A reasonable template for an AI coach:
  - Test week: bat speed and EV with sensor or radar, plus speed tests.
  - 4-week mesocycles of 3–4 swing days a week with max-intent dry swings, ±20% bats as an option, and sensor-logged sets.
  - A retest at the end of each block.
  - Volume ramps, then a deload before travel-ball tryouts.
- Because the evidence is mixed, the app should frame overload/underload as an option, not a guarantee. Measured bat speed should be the arbiter: if bat speed doesn't move after a block, change the stimulus.
- Anti-pattern: promising "+5 mph" outcomes.

### Gaps
- Exact Axe and Driveline set/rep tables, and Driveline's 6-week result numbers, were not retrieved.
- No information was found on Rebel Hitting, Baseball Rebellion's softball arm, PRO Hitting, or "Softball Performance" program structure. Searches returned nothing specific.
- No softball-specific peer-reviewed overload/underload RCT was found.

## 4. Data export and integrations

### Takeaway
Blast supports CSV export, but only from the Blast Connect web portal. Pocket Radar exports CSV and integrates with GameChanger. No public API or Apple Health/HealthKit integration was found for Blast or DK. An outside app would realistically rely on user-uploaded CSVs, manual entry, or screenshot/OCR.

### Cited Findings
- Blast CSV export path, on the website: Analyze → Blast Metrics → three dots on the filter bar → "Save as CSV" — [Blast help: export to CSV](https://blast-motion.helpjuice.com/70954-basic-troubleshooting-steps/how-do-i-export-my-metrics-data-to-an-csv-or-excel-file44)
- One App Store reviewer says an in-app subscription does not include web Blast Connect portal access, which they needed for CSV export (single user report). A user also reports the Blast Connect web version doesn't work on Safari — [Blast Softball App Store](https://apps.apple.com/us/app/blast-softball/id1228437292)
- DK syncs swing data to its cloud via Bluetooth and the app. No public export or API was documented in results — [Bat Digest DK review](https://batdigest.com/blog/diamond-kinetics-review/)
- Pocket Radar app: CSV export, and velocities can be pushed to streaming and scoring apps. A direct GameChanger connection needs Pocket Radar PLUS (one buyer reports about $5/month extra) — [Pocket Radar Smart Coach](https://www.pocketradar.com/products/smart-coach-radar); [Dick's listing](https://www.dickssportinggoods.com/p/pocket-radar-smart-coach-21af7upcktrdrsmrttra/21af7upcktrdrsmrttra)
- Searches turned up no Apple Health integration or public developer API for Blast or DK — [search result summary incl. Blast vs DK](https://blastmotion.com/blog/blast-motion-vs-diamond-kinetics-comparison/)

### Inferences
- MVP integration path: a Blast CSV import (needs the parent's web-portal access), a Pocket Radar CSV import, and fast manual entry such as "today's top 5 bat speeds / EVs." Screenshot OCR of the Blast or DK session summary would be a lower-friction fallback.
- Don't build on an assumed HealthKit feed of swing data.

### Gaps
- The Blast CSV column schema was not retrieved.
- Whether DK offers any export (CSV or email) is unconfirmed.
- Rapsodo and HitTrax export options were not retrieved. Facility HitTrax data is usually only in the facility's account.

## 5. Quickness and speed metrics and recruit benchmarks (softball)

### Takeaway
Home-to-first (H1B) is the main softball speed metric at showcases, followed by the 60-yd dash. Rough D1 targets: right-handed hitter H1B ≤2.9–3.0 s (P4) and 3.0–3.1 s (mid-major); 60-yd ≤8.0 s for P4 (one source); outfielder arm 70+ mph for D1 P4. The timing method (standing start vs. from the swing; righty vs. lefty or slapper) changes times by about 0.5 s, so the app must record the method.

### Cited Findings
- H1B, right-handed hitter: D1 Power 4 ≤2.9 s, D1 mid-major 3.0–3.1, D2 3.1–3.2, D3/NAIA 3.2–3.4. 60-yd: ≤8.0 s for D1 P4. Outfield throwing velocity: 70+ mph for D1 P4, 55–60 for D3/NAIA — [NextCommit guide](https://www.nextcommit.ai/blog/how-to-get-recruited-for-college-softball); [NextCommit timeline](https://www.nextcommit.ai/blog/softball-recruiting-timeline)
- Other sources: D1 H1B of 2.9–3.0 s in one chart and 2.7–2.9 s in another. One source lists the outfielder 60-yd at 7.2–7.9 s — [CommitBound standards](https://commitbound.com/softball/recruiting-standards); [Pathley](https://www.pathley.ai/blog-posts/softball-recruiting-standards-guide)
- A D1 coach on a forum: times are taken from a standing start at home, not from a swing, and a swing start is about 0.5 s slower. A good slapper is ≤2.9 s and a great one about 2.7 s (forum, informal) — [DiscussFastpitch: home to first](https://www.discussfastpitch.com/threads/home-to-first-whtas-fast.14764/); [DiscussFastpitch: slappers](https://www.discussfastpitch.com/threads/slappers-home-to-first.24646/); [Softball Zone forum](https://www.thesoftballzone.com/fastpitchforum/index.php?threads/home-to-first-60-foot-dash-speed.260840/)
- At 16U–18U showcases, the measurables that matter are velocity, pop time, and H1B. Evaluators watch slappers' first step out of the box — [StriveOn tryouts](https://joinstriveon.com/blog/softball-tryouts); [Cindy Bristow baserunning times PDF](https://cdn4.sportngin.com/attachments/document/0149/2160/008off_BaserunningTimes_1_.pdf)
- Outfielders are also judged on routes, jumps off the bat, and communication along with arm — [NextCommit softball recruiting](https://www.nextcommit.ai/softball-recruiting)

### Inferences
- For a CF, the app should track three things: H1B (with standing vs. swing start and batting side), 60-yd or home-to-second, and OF throw velocity (Pocket Radar). A 10-yd split could be a first-step proxy, though no softball benchmark was found for it.

### Gaps
- No authoritative (NFCA or NCAA) softball speed norms were found. All numbers come from recruiting-vendor blogs or forums.
- No softball first-step or 10-yd split benchmarks were found.

## 6. Pricing (2025–2026)

### Takeaway
Consumer sensor setups cost roughly $100–$200 in hardware plus $6–$15 a month. Radar runs $300–$400. Rapsodo is about $3,500+ plus a subscription. HitTrax is accessed by the hour at facilities.

### Cited Findings
- **Blast:** the mobile subscription moves from $9.99/mo or $74.90/yr to $14.99/mo or $99/yr for new subscribers, effective Oct 12, 2026. Blast Connect (baseball, softball, golf) moves to $14.99/mo or $99/yr starting Dec 1, 2026. The App Store shows both older ($9.99/$74.90) and newer ($14.99/$99) listings — [Blast Pricing Update](https://blastmotion.com/blog/blast-pricing-update/); [Blast Baseball App Store](https://apps.apple.com/us/app/blast-baseball/id696974849)
- Blast free tier: one Google Play reviewer says an update limited the free version to 10 swings a day — [Blast Softball Google Play](https://play.google.com/store/apps/details?id=com.blastmotion.sport.softball.blast&hl=en_US)
- **DK:** the app is free. The full experience needs the DK sensor plus a DK+ subscription, and no official price was found. Athletech lists DK+ at $5.99/mo. Sensor prices range from about $99 to $199 across sources. Other figures ($9.99 or $14.99/mo) come from a competitor review site and conflict — [DK softball](https://www.diamondkinetics.com/softball); [Athletech](https://athletech.co/best-softball-swing-analysis-apps/); [Mind & Muscle](https://mindandmuscle.ai/softball-swing-analyzer-app)
- **Pocket Radar Smart Coach:** $399.99 list, $299.99 on sale (Black Friday 2026). Softball Recruiting+ bundles are $429.99 and $529.99. Specs: ±1 mph accuracy, 120 ft range, 25–130 mph. The Ball Coach (about $299) lacks the app — [Pocket Radar Smart Coach](https://www.pocketradar.com/products/smart-coach-radar); [Recruiting bundle XL](https://www.pocketradar.com/products/smart-coach-radar-recruiting-bundle-xl); [Mavtrax comparison](https://mavtrax.com/blog/pocket-radar-smart-coach-vs-ball-coach); [BaseballRadarGuns](https://baseballradarguns.com/pocket-radar-smart-coach/)
- **Rapsodo PRO 2.0 Dual Sport:** $3,500, plus a paywalled subscription for profiles — [Rapsodo](https://rapsodo.com/products/pro-2-dual-baseball-softball-flight-monitor); [Bat Digest](https://batdigest.com/blog/rapsodo-review/)
- **HitTrax (facility example):** $10/hr per player for members and $60/hr for non-members, plus a $25/month add-on membership — [Volusia Sports Center](https://volusiasportscenter.com/hittrax)
- **Driveline TRAQ:** has a free tier with training templates. Teams pay a flat annual rate, and facilities and travel teams pay a per-user rate. Remote hitting program prices were not found. Trajekt sessions cost $100 each ($50 for trainees) — [Why We Created TRAQ](https://www.drivelinebaseball.com/2018/12/why-we-created-traq/); [Trajekt sessions](https://www.drivelinebaseball.com/trajekt-hitting-sessions/)

### Inferences
- A family already pays about $100–$180 a year for a Blast or DK subscription. An AI coaching app layered on top competes for that same budget, so it should add value to the sensor rather than replace it.

### Gaps
- Official current DK+ price, Hitting Vault membership price, and Driveline online hitting price were not retrieved.
- Current Blast sensor hardware price was not confirmed.

## 7. What players and parents praise and complain about

### Takeaway
Praise goes to the instant bat-speed feedback and the impact-synced slow-mo video. Complaints center on subscription paywalls (free-tier limits, the app vs. web portal split), missed swings, Android instability, and accuracy doubts.

### Cited Findings
- **Praise:** video slows at contact and syncs with the metrics. Some users find the free core stats enough for a single hitter — [Blast Softball App Store](https://apps.apple.com/us/app/id1228437292); [DiscussFastpitch: swing tracker](https://www.discussfastpitch.com/threads/any-reason-you-shouldnt-buy-a-swing-tracker.40177/)
- **Paywall:** "latest update makes the free version… worthless with a 10 swing limit per day." Forum users say the yearly membership is needed to unlock all features — [Blast Softball Google Play](https://play.google.com/store/apps/details?id=com.blastmotion.sport.softball.blast&hl=en_US); [DiscussFastpitch](https://www.discussfastpitch.com/threads/any-reason-you-shouldnt-buy-a-swing-tracker.40177/)
- **Missed swings and accuracy:** one parent says the sensor registers only about 75% of the daughter's swings. An Amazon reviewer called the bat and hand speed "highly inaccurate," and the replacement was no better. Older reviews (Gadgeteer 2017) found readings consistent — [Google Play](https://play.google.com/store/apps/details?id=com.blastmotion.sport.softball.blast&hl=en_US); [Amazon reviews](https://www.amazon.com/Blast-Softball-Analyzer-Official-Sensor/product-reviews/B071D5TBP8?pageNumber=2); [The Gadgeteer](https://the-gadgeteer.com/2017/07/15/blast-motion-blast-softball-review/)
- **Android:** users report trouble pairing and staying paired, and an app that "freezes half the time and crashes my phone the other half" — [DiscussFastpitch: Blast Android](https://www.discussfastpitch.com/threads/blast-motion-android.40212/); [Google Play](https://play.google.com/store/apps/details?id=com.blastmotion.sport.softball.blast&hl=en_US)
- **Lost data:** crashes, lost videos, and upload problems appear in App Store reviews — [Blast Connect Mobile App Store](https://apps.apple.com/us/app/id1228912029)
- **DK:** reported to be iOS-only. A competitor says DK reviews include accuracy and stability complaints during live BP (vendor-biased source) — [Blast vs DK](https://blastmotion.com/blog/blast-motion-vs-diamond-kinetics-comparison/)
- **Pocket Radar:** praised for accuracy and video. It can misread when other activity is happening nearby, and EV only reads if the ball speed is greater than the bat speed — [Fastpitcher review](https://fastpitcher.com/softball/pocket-radar-review-smart-coach/); [Pocket Radar softball reviews](https://www.pocketradar.com/pages/softball-reviews)

### Inferences
- Patterns worth copying:
  - Instant per-swing feedback.
  - Impact-synced video.
  - Level-normalized scores.
  - Coach and parent sharing with markup.
  - Gamified single-metric challenges.
  - Block testing and retesting.
  - CSV export.
  - Logging the timing method alongside each speed test.
- Anti-patterns:
  - Hard free-tier caps added after purchase.
  - Splitting app and web entitlements so export needs a second subscription.
  - Benchmarks that conflict across a vendor's own pages.
  - Baseball numbers leaking into softball content.
  - Weak Android support.
  - Unqualified "+5 mph" marketing.
  - History locked behind a paywall.
- The AI coach should tolerate missing or partial sensor data (missed swings) and use the best N swings or medians rather than single values.

### Gaps
- No Reddit (r/Homeplate, r/Softball, r/FastpitchSoftball) threads were retrieved. Full App Store review text was inaccessible because the host was blocked.
