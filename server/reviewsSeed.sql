-- Demo patient reviews for live directory listings.
-- Idempotent: skips rows that already exist for the same listing + reviewer.
-- Reviewer emails use @pocketpills.demo so they never collide with real accounts.

INSERT INTO rating.reviews (
  subject_kind, subject_id, rating, title, body,
  reviewer_key, reviewer_name, reviewer_email, status,
  created_at, updated_at
)
VALUES
(
    'doctor', '5', 5, 'Listened carefully', 'Dr. Shah took time to understand the history before prescribing. The visit felt unhurried and the follow-up plan was clear.',
    'bdf112e32154f3362294ab26f7bc4a175ef8baa1e19249c4914e3398ae19f447', 'Anita S.', 'seed.anita.shrestha@pocketpills.demo', 'visible',
    '2026-08-04 09:20:00+00'::timestamptz, '2026-08-04 09:20:00+00'::timestamptz
  ),
(
    'doctor', '5', 5, 'Clear explanation', 'Explained the labs in plain language and did not push extra tests. Would book again.',
    '8e758c6ed10ff92469857781ea1ea72162d3e02fa5f10428e3f729f34e94bd77', 'Bikash G.', 'seed.bikash.gurung@pocketpills.demo', 'visible',
    '2026-08-04 20:27:00+00'::timestamptz, '2026-08-04 20:27:00+00'::timestamptz
  ),
(
    'doctor', '5', 4, 'Good consult, slightly late', 'Solid advice for my blood pressure. Started about fifteen minutes late, but the consult itself was thorough.',
    '8c77d747cc2cc9764ce0665e922dea7beaefa49899748463683d24a81bd0228b', 'Sita M.', 'seed.sita.maharjan@pocketpills.demo', 'visible',
    '2026-08-05 07:34:00+00'::timestamptz, '2026-08-05 07:34:00+00'::timestamptz
  ),
(
    'doctor', '5', 4, 'Helpful for a second opinion', 'Came for a second opinion on a skin issue. Diagnosis matched what I later confirmed, and the prescription was easy to fill.',
    'ba9555d1312721e3b2780fbac14c5906c0db599d1ff85fed98bf82fe03ad1015', 'Ramesh K.', 'seed.ramesh.karki@pocketpills.demo', 'visible',
    '2026-08-05 18:41:00+00'::timestamptz, '2026-08-05 18:41:00+00'::timestamptz
  ),
(
    'doctor', '5', 3, 'Fine, a bit rushed', 'Advice was correct but the visit felt short. Would have liked more time for questions about diet.',
    '1c2ebd6e711de52c9c74ed8198ce3de8656fd83e1579a5a782cee8ac5bde8cf7', 'Nisha T.', 'seed.nisha.tamang@pocketpills.demo', 'visible',
    '2026-08-06 05:48:00+00'::timestamptz, '2026-08-06 05:48:00+00'::timestamptz
  ),
(
    'doctor', '10', 5, 'Very professional', 'Dr. Bhattarai was punctual and the clinic staff coordinated the next steps without me chasing anyone.',
    '26fe600c62c8afd9b400a3f4e4134328acac1b69f5b524a4445578807590ac67', 'Prakash A.', 'seed.prakash.adhikari@pocketpills.demo', 'visible',
    '2026-08-06 16:55:00+00'::timestamptz, '2026-08-06 16:55:00+00'::timestamptz
  ),
(
    'doctor', '10', 5, 'Trusted with family care', 'Brought my father in. The doctor spoke with him respectfully and adjusted medicines carefully.',
    '14a42c81488fdb73161e362076d849a3e9b15543fc594042e31eef6c5da0baf9', 'Maya R.', 'seed.maya.rai@pocketpills.demo', 'visible',
    '2026-08-07 04:02:00+00'::timestamptz, '2026-08-07 04:02:00+00'::timestamptz
  ),
(
    'doctor', '10', 4, 'Straightforward', 'No unnecessary tests. Treatment for the infection worked within a few days.',
    '45cb4725b85faec382db132f627a2ace2d71a5291005c4f0af58c1e16a7f67dc', 'Kiran B.', 'seed.kiran.basnet@pocketpills.demo', 'visible',
    '2026-08-07 15:09:00+00'::timestamptz, '2026-08-07 15:09:00+00'::timestamptz
  ),
(
    'doctor', '6', 5, 'Worth the visit from Dharan', 'Travelled in for a consult. Felt well prepared and the notes were easy to share with my local pharmacy.',
    '50df9675dfe700ecfb0df5f0e25bac426b3830be54adf79f982865134aca25b6', 'Aarati L.', 'seed.aarati.limbu@pocketpills.demo', 'visible',
    '2026-08-08 01:26:00+00'::timestamptz, '2026-08-08 01:26:00+00'::timestamptz
  ),
(
    'doctor', '6', 4, 'Calm and precise', 'Good bedside manner. Waiting area was busy but the appointment itself was on time.',
    'e102ba0e836f7178e714894b5a690eea403753e9d2e4db2bf616bad749d9574b', 'Dipesh Y.', 'seed.dipesh.yadav@pocketpills.demo', 'visible',
    '2026-08-08 12:33:00+00'::timestamptz, '2026-08-08 12:33:00+00'::timestamptz
  ),
(
    'pharmacy', '3711213090457', 5, 'Filled the same afternoon', 'Prescription was ready the same day and they flagged a cheaper generic that my doctor had already approved.',
    'fad2cacf261717ed1486c63a0fe3315273f3045409857910894dd2e49f2f18ac', 'Sunita K.', 'seed.sunita.kc@pocketpills.demo', 'visible',
    '2026-08-08 23:40:00+00'::timestamptz, '2026-08-08 23:40:00+00'::timestamptz
  ),
(
    'pharmacy', '3711213090457', 4, 'Reliable stock', 'Had both medicines in stock. Billing was clear. Delivery took a little longer than promised.',
    'd0d2639e6c2baf7d6b287d6f8880a830f8cc7a827e9d2315ee67b17e0968814b', 'Hari P.', 'seed.hari.poudel@pocketpills.demo', 'visible',
    '2026-08-09 10:47:00+00'::timestamptz, '2026-08-09 10:47:00+00'::timestamptz
  ),
(
    'pharmacy', '3711213090457', 5, 'Helpful pharmacist', 'Asked about allergies before dispensing and labelled the doses clearly for my mother.',
    'ce5ae3c7ac2df9ab8af22dd07578a4fbe63d1ec90c805938d48c318785aaf229', 'Laxmi S.', 'seed.laxmi.shrestha@pocketpills.demo', 'visible',
    '2026-08-09 21:54:00+00'::timestamptz, '2026-08-09 21:54:00+00'::timestamptz
  ),
(
    'pharmacy', '3711215063850', 4, 'Convenient in Tokha', 'Easy to find and the staff knew the prescription on the second visit. Queue moved quickly.',
    '0ac2bc6aef82f24fb1a050a1603099c1460ae1567be9447522be9f3dfce84d6a', 'Binod M.', 'seed.binod.maharjan@pocketpills.demo', 'visible',
    '2026-08-10 09:01:00+00'::timestamptz, '2026-08-10 09:01:00+00'::timestamptz
  ),
(
    'pharmacy', '3711215063850', 3, 'One item was delayed', 'Most items were ready. One antibiotic had to come the next morning, and they did call to confirm.',
    '3b6e65ae5f1ab1d929e70405b37d95c1dedb0913618b49170e18ad7f2e257b19', 'Pooja T.', 'seed.pooja.thapa@pocketpills.demo', 'visible',
    '2026-08-10 20:08:00+00'::timestamptz, '2026-08-10 20:08:00+00'::timestamptz
  ),
(
    'facility', '3060100072', 5, 'Organised OPD', 'Registration was orderly and the physician had my previous notes. Felt like a proper hospital visit, not a rush.',
    'dd1feec08ea84df6f2af78bbc937d0cf5761dc32a8534769d4b187b4994d23fb', 'Sanjay S.', 'seed.sanjay.shrestha@pocketpills.demo', 'visible',
    '2026-08-11 06:25:00+00'::timestamptz, '2026-08-11 06:25:00+00'::timestamptz
  ),
(
    'facility', '3060100072', 4, 'Clean and attentive', 'Wards and waiting area were clean. Lab results came the same day. Parking was the only hassle.',
    'c989bbaf67af71537410d54a7a19bed07629d4a09c801f82906318d8500b018a', 'Meena G.', 'seed.meena.gautam@pocketpills.demo', 'visible',
    '2026-08-11 17:32:00+00'::timestamptz, '2026-08-11 17:32:00+00'::timestamptz
  ),
(
    'facility', '3060100072', 5, 'Emergency desk was calm', 'Went in with a high fever. Triage was quick and they explained each step before treatment.',
    'da24b9f044d6a989cbbfa14c06e63b6a8e0176890fa386b4594bd852389a6403', 'Roshan M.', 'seed.roshan.magar@pocketpills.demo', 'visible',
    '2026-08-12 04:39:00+00'::timestamptz, '2026-08-12 04:39:00+00'::timestamptz
  ),
(
    'facility', '3060100072', 2, 'Long wait for diagnostics', 'Consult was fine, but the imaging queue took most of the afternoon with little update. Staff were polite, process was not.',
    '72008594813eab559d3ab08481a35221942b1115fcd7f182753cba743958d133', 'Kabita S.', 'seed.kabita.sharma@pocketpills.demo', 'visible',
    '2026-08-12 15:46:00+00'::timestamptz, '2026-08-12 15:46:00+00'::timestamptz
  ),
(
    'facility', '3060100092', 5, 'Compassionate care', 'Nurses checked in often and the doctor explained the discharge medicines slowly. Grateful for how they treated my mother.',
    'c238d053d19b2eca597513152951e17b01c2a25f67922ea12b786d1aa4fa04a3', 'Anil M.', 'seed.anil.maharjan@pocketpills.demo', 'visible',
    '2026-08-13 02:53:00+00'::timestamptz, '2026-08-13 02:53:00+00'::timestamptz
  ),
(
    'facility', '3060100092', 4, 'Solid follow-up', 'Follow-up visit was on time and they had the previous labs printed. Would have liked clearer signage at the entrance.',
    '536a4c1d7d961f5aab25971371019644572a30d1ef985819b5b76f9cd5497f29', 'Sarita G.', 'seed.sarita.gurung@pocketpills.demo', 'visible',
    '2026-08-13 14:00:00+00'::timestamptz, '2026-08-13 14:00:00+00'::timestamptz
  )
ON CONFLICT (subject_kind, subject_id, reviewer_key) WHERE (status IN ('pending', 'visible', 'hidden'))
DO NOTHING;

