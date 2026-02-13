import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Menu, X, Star, Coffee, Leaf, Award, Check, Trash2, Mail, MapPin, Phone, ArrowLeft, User, LogOut, Share2, Link2 } from 'lucide-react';

// --- BRAND ASSETS & DATA ---

const PRODUCTS = [
  {
    id: "fuse",
    name: "FUSE",
    subtitle: "Mushroom Fuse Instant Coffee",
    price: 38.00,
    rating: 5,
    reviews: 124,
    category: "functional",
    tag: "Best Seller",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209595/1766845371046-generated-label-image-0_omteke.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209605/1766845371047-generated-label-image-1_ym8z0w.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209610/1766845371052-generated-label-image-4_k8bpjd.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209614/1766845371050-generated-label-image-3_ayngvz.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209621/1766845371049-generated-label-image-2_f7zfnx.jpg"
    ],
    description: "Mushroom Fuse Instant Coffee is where rich flavor meets functional wellness. This medium roast blend combines our freeze-dried single-origin coffee with Lion’s Mane and Chaga mushroom powders, bringing earthy, smooth, and indulgent notes to every cup.\n\nWith 70% Papua New Guinea instant coffee, Brazilian beans, and Mexican beans forming the perfect balance, this functional coffee delivers both taste and performance. Bourbon, Typica, Catuaí, and Mundo Novo varietals come together to create a chocolate-rich, full-bodied foundation.",
    details: {
      origin: "Papua New Guinea, Brazil, Mexico",
      roast: "Medium",
      ingredients: "70% Roasted Arabica Coffee, 15% Organic Lion’s Mane Powder, 15% Organic Chaga Mushroom Powder",
      weight: "1.9oz / 54g"
    },
    nutritionSpecs: {
      ingredients: "70% Roasted Instant Coffee, 15% Organic Lion’s Mane Powder, 15% Organic Chaga Mushroom Powder",
      varietals: "Bourbon, Typica, Catuaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Papua New Guinea (Single Origin)",
      productAmount: "1.9 oz",
      grossWeight: "3.2 oz",
      suggestedUse: "Add one tablespoon to a cup and pour in 8-10 fl oz of hot or cold water. Stir and enjoy.",
      hasNutritionPanelImage: true
    }
  },
  {
    id: "zen",
    name: "ZEN",
    subtitle: "Ceremonial Matcha Powder",
    price: 45.00,
    rating: 5,
    reviews: 89,
    category: "functional",
    tag: "Ceremonial Grade",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209664/1767204402115-generated-label-image-0_j8n70v.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209681/1767204402115-generated-label-image-1_qe6shk.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209677/1767204402117-generated-label-image-2_mw4fsq.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209674/1767204402119-generated-label-image-3_poax8i.jpg"
    ],
    description: "Ceremonial Matcha Powder offers the ultimate matcha experience. Vibrant green, finely milled, and rich in naturally sweet, umami flavor. Made from shade-grown Camellia sinensis tea leaves and stone-ground to a silky powder, this matcha is perfect for daily rituals or mindful moments.\n\nWhether whisked straight with hot water or blended into a creamy latte, it delivers smooth, sustained energy and focus without the crash.",
    details: {
      origin: "Japan",
      grade: "Ceremonial",
      ingredients: "100% Matcha Tea Powder",
      weight: "1.9oz / 54g"
    },
    nutritionSpecs: {
      ingredients: "100% Matcha Tea Powder",
      manufacturerCountry: "USA",
      region: "Japan, Kagoshima",
      productAmount: "1.9 oz",
      grossWeight: "2.54 oz",
      suggestedUse: "Add one tablespoon of matcha to your cup and pour in hot water. Stir until smooth.",
      cleanLabelClaims: ["Vegetarian", "Vegan"]
    }
  },
  {
    id: "onyx",
    name: "ONYX",
    subtitle: "Sweet Brew Instant Coffee",
    price: 28.00,
    rating: 4,
    reviews: 215,
    category: "single_origin",
    tag: "Dark Roast",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209703/1767205155638-generated-label-image-0_smjxbd.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209738/1767205155639-generated-label-image-1_sd2wkb.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209728/1767205155641-generated-label-image-2_zutgca.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209733/1767205155643-generated-label-image-3_rzvgzt.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767209745/1767205155644-generated-label-image-4_nxdhu7.jpg"
    ],
    description: "Sweet Brew Instant Coffee brings the taste of carefully crafted single-origin coffee instantly. Made with Arabica beans grown in the highlands of Papua New Guinea, this dark roast captures toasted almond richness, delicate fruit acidity, and a soft toffee finish in every cup.\n\nThe beans are washed, freeze-dried, and preserved to protect their original flavor and aroma. No bitterness, no shortcuts.",
    details: {
      origin: "Papua New Guinea (Single Origin)",
      roast: "Dark",
      ingredients: "100% Arabica",
      weight: "1.9oz / 54g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica Instant Coffee",
      varietals: "Arusha, Bourbon, Typica, Blue Mountain",
      manufacturerCountry: "USA",
      region: "Papua New Guinea (Single Origin)",
      productAmount: "1.9 oz",
      grossWeight: "3.2 oz",
      suggestedUse: "Add one tablespoon to a cup and pour in 8-10 fl oz of hot or cold water. Stir and enjoy."
    }
  },
  {
    id: "vitality",
    name: "VITALITY",
    subtitle: "Vitality Mushroom Coffee",
    price: 36.00,
    rating: 5,
    reviews: 67,
    category: "functional",
    tag: "Adaptogenic",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767212482/1767212331011-generated-label-image-0_etlsle.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767212491/1767212331012-generated-label-image-1_ufyz2v.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767212504/1767212331099-generated-label-image-2_xwutse.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767212511/1767212331102-generated-label-image-3_yifrzr.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767212498/1767212331104-generated-label-image-4_ickwap.jpg"
    ],
    description: "Vitality Mushroom Coffee is where flavor meets function. This full-bodied medium roast combines premium beans from Brazil and Mexico with Lion’s Mane and Chaga mushroom powders, bringing together deep chocolate flavor with the natural benefits of adaptogens.\n\nCrafted to help you feel sharp without the crash, it’s ideal for your morning ritual or mid-day lift.",
    details: {
      origin: "Brazil, Mexico",
      roast: "Medium",
      ingredients: "90% Roasted Arabica Coffee, 5% Lion’s Mane, 5% Chaga",
      weight: "12oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "90% Roasted Ground Arabica Coffee, 5% Lion’s Mane Powder, 5% Chaga Powder",
      varietals: "Catuaí, Catucaí",
      manufacturerCountry: "USA",
      region: "Brazil, Minas Gerais; Mexico, Chiapas",
      productAmount: "12 oz",
      grossWeight: "15.17 oz",
      suggestedUse: "Pour two tablespoons of medium ground coffee into 6 fl oz of hot water and brew.",
      cleanLabelClaims: ["Vegetarian", "Vegan"],
      hasNutritionPanelImage: true
    }
  },
  {
    id: "harvest",
    name: "HARVEST",
    subtitle: "Hemp Harvest Coffee",
    price: 34.00,
    rating: 5,
    reviews: 42,
    category: "functional",
    tag: "Superfood",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767216044/1767215853330-generated-label-image-0_dp2u51.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767216084/1767215853330-generated-label-image-1_gkoeg8.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767216070/1767215853333-generated-label-image-2_dluaq8.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767216063/1767215853334-generated-label-image-3_a9t87e.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767216055/1767215853336-generated-label-image-4_apuiuk.jpg"
    ],
    description: "Hemp Harvest Coffee blends taste and functionality. Experience the richness of a medium roast with the earthy, nutty character of hemp, topped with an energy kick and nourishment.\n\nSourced from Brazil and Mexico, this combo highlights Brazilian Catuaí and Catucaí varietals as well as the clean structure of Mexican beans. Hemp brings plant-based nutrition to the mix.",
    details: {
      origin: "Brazil, Mexico",
      roast: "Medium",
      ingredients: "91% Roasted Arabica Coffee, 9% Hemp Protein Powder",
      weight: "12oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "91% Roasted Ground Arabica Coffee, 9% Hemp Protein Powder",
      varietals: "Catuaí, Catucaí",
      manufacturerCountry: "USA",
      region: "Brazil, Minas Gerais; Mexico, Chiapas",
      productAmount: "12 oz",
      grossWeight: "15.17 oz",
      suggestedUse: "Pour two tablespoons of medium ground coffee into 6 fl oz of hot water and brew.",
      cleanLabelClaims: ["Vegetarian", "Vegan"],
      hasNutritionPanelImage: true
    }
  },
  {
    id: "aureo",
    name: "AUREO",
    subtitle: "Golden Nut Toffee Coffee",
    price: 26.00,
    rating: 5,
    reviews: 112,
    category: "single_origin",
    tag: "Single Origin",
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767217072/6843a1f1-d7bc-41c5-97b3-990b7dd18a18.png",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767217140/7f9a85e0-4293-4efe-814c-671abf11f59b.png",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767217099/8d57a51c-021b-4395-a18a-fe0470503021.png",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767217134/74c9cc4a-30f2-4f2e-8def-96e1f71c0574.png",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1767217150/b1b6f2a0-80b3-4271-902b-ee81902fa402.png"
    ],
    description: "Golden Nut Toffee Coffee brings comfort in every cup. This Brazilian single-origin medium roast offers rich, rounded flavors with notes of roasted peanut, soft milk chocolate, and a touch of honey-like sweetness.\n\nCrafted from a blend of Catuaí, Catucaí, Catigua, and Topázio varietals, this coffee captures the classic Brazilian profile that’s beloved worldwide.",
    details: {
      origin: "Brazil (Cerrado)",
      roast: "Medium",
      ingredients: "100% Arabica Whole Beans",
      weight: "12oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica Whole Coffee Beans",
      varietals: "Catuaí, Catucaí, Catigua, Topázio",
      manufacturerCountry: "USA",
      region: "Brazil, Cerrado",
      productAmount: "12 oz",
      grossWeight: "15.17 oz",
      suggestedUse: "Pour two tablespoons of medium ground coffee into 6 fl oz of hot water and brew.",
      cleanLabelClaims: ["Non-GMO", "Soy-Free", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"]
    }
  }
];

const ROUTE_PATHS = {
  home: '/',
  shop_all: '/collections',
  shop_functional: '/collections/functional',
  shop_single_origin: '/collections/single-origin',
  checkout: '/checkout',
  rewards: '/rewards',
  about: '/about',
  sourcing: '/sourcing',
  wholesale: '/wholesale',
  subscription: '/subscription',
  contact: '/contact',
  account: '/account',
  privacy: '/privacy',
  terms: '/terms',
  shipping_returns: '/shipping-returns',
  rewards_terms: '/rewards-terms',
  subscription_terms: '/subscription-terms',
};

const LEGAL_CONTENT = {
  privacy: `Last Updated: February 8, 2026

Velure Coffee Co. ("Velure," "we," "our," "us") respects your privacy. This Privacy Policy explains what we collect, why we collect it, and your choices.

1. Information We Collect
- Information you provide directly:
  - Contact form: name, email, message.
  - Newsletter/subscription form: email and selected plan tier details.
  - Account authentication: email and encrypted credential data handled by our authentication provider.
  - Checkout details submitted to our checkout endpoint: cart items, quantities, and customer checkout details (for example name and email).
- Information collected automatically:
  - IP address, browser/device user agent, request timestamps.
  - Site interaction data through analytics events (for example product views, add-to-cart, checkout start, and lead submissions).

2. How We Use Information
We use information to:
- Process and support orders and checkout flows.
- Respond to support and wholesale inquiries.
- Send newsletters, subscription updates, and related marketing communications.
- Detect spam, abuse, fraud, and security incidents.
- Improve site performance, usability, and product experience.

3. Legal Bases (where applicable)
Depending on your location, we process data based on:
- Performance of a contract (orders and service delivery).
- Legitimate interests (security, fraud prevention, site improvement).
- Consent (newsletter/subscription marketing where required by law).
- Compliance with legal obligations.

4. Sharing and Disclosure
We do not sell personal information for money.
We may share data with service providers that help us operate the business, such as:
- Hosting and infrastructure providers.
- Payment processors and checkout providers.
- Form handling, messaging, and analytics tools.
We may also disclose data when required by law, to enforce our terms, or to protect rights and safety.

5. Cookies and Similar Technologies
We and our vendors may use cookies, local storage, pixels, and similar technologies to:
- Keep cart/session functionality working.
- Measure traffic and campaign performance.
- Understand content and product engagement.
You can control cookies in your browser settings. Blocking some cookies may affect functionality.

6. Data Retention
We retain personal information only as long as reasonably necessary for business, legal, tax, fraud-prevention, and operational purposes.

7. Data Security
We use reasonable administrative, technical, and organizational safeguards. No online system is 100% secure, but we continuously work to reduce risk.

8. Your Privacy Rights
Depending on your state/country, you may have rights to:
- Access or know what personal information we hold.
- Request deletion or correction.
- Opt out of certain targeted advertising or sharing activities.
- Appeal certain privacy decisions where required.
To submit a request, contact: concierge@velureritual.com.

9. Marketing Choices
You can unsubscribe from marketing emails at any time by using the unsubscribe link in the email or by contacting us directly.

10. Children's Privacy
Our site is not directed to children under 13, and we do not knowingly collect personal information from children under 13.

11. International Visitors
If you access the site from outside the United States, you understand your data may be processed in the U.S. or other jurisdictions where our providers operate.

12. Policy Updates
We may update this policy periodically. Changes are effective when posted with a new "Last Updated" date.

13. Contact
Velure Coffee Co.
Email: concierge@velureritual.com`,
  terms: `Last Updated: February 8, 2026

These Terms of Service ("Terms") govern your use of the Velure Coffee website and related services. By using our site, you agree to these Terms.

1. Eligibility and Use
You must use this site in compliance with applicable law. You agree not to misuse the site, interfere with operations, or attempt unauthorized access.

2. Product Information
We make reasonable efforts to ensure product descriptions, pricing, and availability are accurate, but errors may occur. We reserve the right to correct errors and update information at any time.

3. Orders and Acceptance
Placing an order is an offer to buy. We may accept, reject, or cancel any order, including for pricing errors, suspected fraud, or stock issues. If we cancel after payment, we will issue a refund to the original payment method.

4. Payments
Checkout and payment processing may be provided by third-party processors (for example Stripe). Your payment relationship with that provider is governed by their terms and policies.

5. Shipping and Delivery
Shipping timelines are estimates and not guaranteed. Risk of loss transfers according to applicable law and carrier handling.
See our Shipping & Returns Policy for full details.

6. Returns and Refunds
Returns and refunds are handled under our Shipping & Returns Policy, including eligibility and condition requirements.

7. Subscriptions and Marketing
If you join newsletter or subscription updates, you agree to receive communications related to offers, product updates, and account/service notices. You may unsubscribe from marketing messages at any time.
See Subscription Terms for recurring offer details and cancellation language.

8. Rewards Program
If you participate in rewards features, your participation is also subject to our Rewards Terms.

9. Intellectual Property
All site content, branding, design elements, copy, and media are owned by Velure or licensed to us. You may not reproduce, distribute, or exploit site content without written permission.

10. User Content and Feedback
If you submit reviews, comments, or feedback, you grant us a non-exclusive, worldwide, royalty-free license to use it for business purposes, consistent with applicable law.

11. Disclaimers
The site and services are provided "as is" and "as available," without warranties of any kind to the extent allowed by law.
Statements about taste, wellness, or functional ingredients are informational and not medical advice. These products are not intended to diagnose, treat, cure, or prevent any disease.

12. Limitation of Liability
To the maximum extent permitted by law, Velure is not liable for indirect, incidental, special, consequential, or punitive damages arising from site or product use.

13. Indemnification
You agree to indemnify and hold Velure harmless from claims arising from your misuse of the site, violation of these Terms, or violation of law.

14. Governing Law
These Terms are governed by the laws of the State of California, without regard to conflict-of-law principles, unless otherwise required by law.

15. Changes to Terms
We may update these Terms at any time. Updated Terms are effective when posted.

16. Contact
Questions about these Terms: concierge@velureritual.com`,
  shippingReturns: `Last Updated: February 13, 2026

1. Shipping Coverage
Velure ships to the contiguous United States (48 states), Canada, and selected international countries shown at checkout.

2. Countries We Currently Ship To
- U.S. (contiguous 48 states)
- Zone 1: Canada
- Zone 2: Belgium, Denmark, Finland, France, Iceland, Italy, Liechtenstein, Luxembourg, Malta, Monaco, Netherlands, Norway, Portugal, Sweden, United Kingdom
- Zone 3: Australia, Bulgaria, Croatia, Cyprus, Czech Republic, Estonia, Hungary, Indonesia, Latvia, Lithuania, Macau SAR, New Zealand, Philippines, Poland, Romania, Slovakia, Slovenia, South Korea, Thailand, Vietnam

3. Destinations Not Currently Available
- Spain is temporarily unavailable.
- Alaska and Hawaii are not available at this time.
- APO/FPO/DPO military addresses are not available at this time.

4. Processing Time
Orders are typically processed within 1-3 business days (excluding weekends and major holidays).

5. Delivery Estimates
- U.S. Standard: 2-5 business days
- International Standard: 4-15 business days
Delivery windows are estimates and not guarantees.

6. Shipping Rates (USD, by package weight)
U.S. Standard:
- Up to 0.5 lb: $4.50
- 0.51-0.75 lb: $5.50
- 0.76-1.00 lb: $6.50
- 1.01-2.00 lb: $8.00
- 2.01-3.00 lb: $10.00
- Over 3 lb: +$1.00 for each additional lb

International Standard:
- Zone 1 (Canada): 1 lb $17, 2 lb $19, 3 lb $21, 4 lb $24, then +$5 per additional lb
- Zone 2: 1 lb $18, 2 lb $20, 3 lb $23, 4 lb $26, then +$5 per additional lb
- Zone 3: 1 lb $20, 2 lb $24, 3 lb $28, 4 lb $32, then +$6 per additional lb

7. Duties and Taxes
For international deliveries, import duties, taxes, and customs fees may apply and are the customer's responsibility unless stated otherwise at checkout.

8. Incorrect Address / Failed Delivery
Please verify your shipping address before placing an order. We are not responsible for delays or losses caused by incorrect addresses provided at checkout.

9. Damaged or Missing Items
If your order arrives damaged or incomplete, contact concierge@velureritual.com within 7 days of delivery with photos and order details.

10. Return Eligibility
Unopened products in original condition may be returned within 30 days of delivery unless marked final sale.

11. Non-Returnable Items
For food safety reasons, opened consumable products are generally non-returnable unless defective or required by applicable law.

12. Return Process
Email concierge@velureritual.com with your order number and reason for return. If approved, we will provide return instructions.

13. Refund Timing
Approved refunds are issued to the original payment method after returned items are received and inspected. Processing time may vary by payment provider.

14. Exchanges
We do not guarantee direct exchanges. In most cases, approved returns are refunded and a new order can be placed.`,
  rewardsTerms: `Last Updated: February 8, 2026

These Rewards Terms apply to Velure rewards participation.

1. Program Basics
The rewards experience allows eligible users to earn and redeem points for select benefits.

2. Eligibility
You must provide a valid email and comply with our Terms of Service to participate.

3. Earning Points
Points may be awarded for qualifying purchases and limited promotional actions (for example referrals or reviews, when offered).

4. Redemption
Points may be redeemed for eligible discounts or shipping-related perks where available. Redemption options may vary over time.

5. No Cash Value
Points are promotional and have no cash value unless explicitly required by law.

6. Expiration and Forfeiture
We may apply inactivity expiration windows or promotional expiration dates. Expired or forfeited points cannot be reinstated unless required by law.

7. Returns and Chargebacks
If an order is refunded, canceled, or charged back, related points may be removed or adjusted.

8. Abuse and Fraud
We may suspend or terminate rewards access for abuse, fraud, duplicate accounts, or policy violations.

9. Program Changes
We may modify, pause, or end the rewards program, point values, and redemption rules at any time, with notice where required by law.

10. Relationship to Other Terms
These Rewards Terms supplement our Terms of Service and Privacy Policy.`,
  subscriptionTerms: `Last Updated: February 8, 2026

These Subscription Terms govern recurring plan offers and subscription communications.

1. Subscription Offers
Displayed plans describe expected monthly quantity and promotional pricing (when available). Final price and taxes are shown before payment.

2. Authorization
By subscribing, you authorize recurring charges according to the selected plan and billing cadence until canceled.

3. Billing and Renewal
Subscriptions renew automatically unless canceled before the next billing date.

4. Cancellation
You may cancel before your next billing cycle to avoid future charges. Cancellation does not reverse charges already processed for the current cycle.

5. Price and Plan Changes
We may update subscription pricing, contents, or benefits. Material changes will be communicated before they take effect where required by law.

6. Failed Payments
If payment fails, we may retry, pause, or cancel the subscription.

7. Shipping for Subscription Orders
Subscription shipments follow our Shipping & Returns Policy and may vary by fulfillment timing.

8. Marketing and Service Messages
Subscription participants may receive transactional and service-related messages, plus optional marketing emails. You can unsubscribe from marketing emails at any time.

9. Termination
We may suspend or terminate subscriptions for fraud, abuse, non-payment, or policy violations.

10. Additional Terms
These Subscription Terms supplement our Terms of Service and Privacy Policy.`,
};

const REWARDS_STORAGE_KEY = 'velure_rewards_profile';
const PENDING_CHECKOUT_STORAGE_KEY = 'velure_pending_checkout_v1';
const REWARDS_SIGNUP_BONUS = 150;
const REWARDS_POINTS_PER_DOLLAR = 5;
const STANDARD_SHIPPING_FEE = 6.95;
const FREE_SHIPPING_THRESHOLD = 50;
const STRIPE_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
const STRIPE_JS_SRC = 'https://js.stripe.com/v3';
let stripeJsPromise = null;

const REWARD_OFFERS = [
  {
    id: 'five_off',
    name: '$5 Off Order',
    pointsCost: 500,
    type: 'discount',
    discountValue: 5,
    description: 'Apply an instant $5 discount to your checkout total.',
  },
  {
    id: 'free_shipping',
    name: 'Free Shipping',
    pointsCost: 350,
    type: 'shipping',
    discountValue: STANDARD_SHIPPING_FEE,
    description: 'Remove standard shipping on orders under $50.',
  },
];

const REWARD_OFFER_MAP = Object.fromEntries(REWARD_OFFERS.map((offer) => [offer.id, offer]));

const DEFAULT_REWARDS_PROFILE = {
  enrolled: false,
  email: '',
  points: 0,
  lifetimePoints: 0,
  activeRewardId: null,
  history: [],
};

const getRewardOffer = (rewardId) => (rewardId ? REWARD_OFFER_MAP[rewardId] || null : null);

const normalizeRewardsProfile = (value) => {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_REWARDS_PROFILE };
  }

  return {
    enrolled: Boolean(value.enrolled),
    email: typeof value.email === 'string' ? value.email : '',
    points: Number.isFinite(Number(value.points)) ? Math.max(0, Math.floor(Number(value.points))) : 0,
    lifetimePoints: Number.isFinite(Number(value.lifetimePoints))
      ? Math.max(0, Math.floor(Number(value.lifetimePoints)))
      : 0,
    activeRewardId: typeof value.activeRewardId === 'string' && getRewardOffer(value.activeRewardId)
      ? value.activeRewardId
      : null,
    history: Array.isArray(value.history) ? value.history.slice(0, 15) : [],
  };
};

const appendRewardsHistory = (profile, entry) => {
  const item = {
    id: `rw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  };
  return {
    ...profile,
    history: [item, ...(Array.isArray(profile.history) ? profile.history : [])].slice(0, 15),
  };
};

const getRewardsTier = (lifetimePoints) => {
  if (lifetimePoints >= 2500) return 'Gold';
  if (lifetimePoints >= 1000) return 'Silver';
  return 'Bronze';
};

const getPointsToNextTier = (lifetimePoints) => {
  if (lifetimePoints >= 2500) return 0;
  if (lifetimePoints >= 1000) return 2500 - lifetimePoints;
  return 1000 - lifetimePoints;
};

const getCheckoutPricing = (subtotal, rewardId) => {
  const parsedSubtotal = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
  const subtotalValue = Math.max(0, Number(parsedSubtotal.toFixed(2)));
  const baseShipping = subtotalValue >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const reward = getRewardOffer(rewardId);
  let shipping = baseShipping;
  let rewardDiscount = 0;

  if (reward?.type === 'discount') {
    rewardDiscount = Math.min(reward.discountValue, subtotalValue);
  }

  if (reward?.type === 'shipping') {
    shipping = 0;
  }

  const total = Math.max(0, Number((subtotalValue + shipping - rewardDiscount).toFixed(2)));
  return {
    subtotal: subtotalValue,
    shipping: Number(shipping.toFixed(2)),
    rewardDiscount: Number(rewardDiscount.toFixed(2)),
    total,
    reward,
  };
};

const getCheckoutItemsFromCart = (cart) => {
  const itemCounts = cart.reduce((accumulator, item) => {
    accumulator[item.id] = (accumulator[item.id] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(itemCounts).map(([productId, quantity]) => ({ productId, quantity }));
};

const getRouteFromPath = (pathname) => {
  const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;
  const productMatch = normalizedPathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    const hasProduct = PRODUCTS.some((product) => product.id === productId);

    if (!hasProduct) {
      return {
        view: 'shop_all',
        productId: null,
      };
    }

    return {
      view: 'product_detail',
      productId,
    };
  }

  const matchedView = Object.entries(ROUTE_PATHS).find(([, path]) => path === normalizedPathname)?.[0];
  return {
    view: matchedView || 'home',
    productId: null,
  };
};

const getPathForView = (view, options = {}) => {
  if (view === 'product_detail' && options.productId) {
    return `/products/${encodeURIComponent(options.productId)}`;
  }

  return ROUTE_PATHS[view] || ROUTE_PATHS.home;
};

const normalizeLower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const AUTH_STORAGE_KEY = 'velure_auth_state_v1';
const DEFAULT_AUTH_STATE = {
  isLoading: false,
  user: null,
  session: null,
};

const normalizeAuthState = (value) => {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_AUTH_STATE };
  }

  const session = value.session && typeof value.session === 'object'
    ? {
        accessToken: typeof value.session.accessToken === 'string' ? value.session.accessToken : '',
        refreshToken: typeof value.session.refreshToken === 'string' ? value.session.refreshToken : '',
        expiresAt: Number.isFinite(Number(value.session.expiresAt)) ? Number(value.session.expiresAt) : 0,
      }
    : null;

  const user = value.user && typeof value.user === 'object'
    ? {
        id: typeof value.user.id === 'string' ? value.user.id : '',
        email: typeof value.user.email === 'string' ? value.user.email : '',
      }
    : null;

  if (!session?.accessToken || !user?.id) {
    return {
      isLoading: false,
      user: null,
      session: null,
    };
  }

  return {
    isLoading: false,
    user,
    session,
  };
};

const getSupabaseConfig = () => {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    throw new Error('Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return { url, anonKey };
};

const parseSupabaseError = (payload, fallbackMessage) => {
  if (!payload || typeof payload !== 'object') return fallbackMessage;
  if (typeof payload.error_description === 'string' && payload.error_description.trim()) {
    return payload.error_description;
  }
  if (typeof payload.msg === 'string' && payload.msg.trim()) {
    return payload.msg;
  }
  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }
  return fallbackMessage;
};

const supabaseRequest = async (path, options = {}) => {
  const { url, anonKey } = getSupabaseConfig();
  const {
    method = 'GET',
    body,
    accessToken,
  } = options;

  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const response = await fetch(`${url}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(parseSupabaseError(payload, 'Unable to complete auth request.'));
  }

  return payload;
};

const createSessionFromSupabasePayload = (payload) => {
  const source = payload?.session && typeof payload.session === 'object'
    ? payload.session
    : payload;
  const accessToken = typeof source?.access_token === 'string' ? source.access_token : '';
  const refreshToken = typeof source?.refresh_token === 'string' ? source.refresh_token : '';
  const expiresAtSeconds = Number(source?.expires_at);
  const expiresInSeconds = Number(source?.expires_in);
  const expiresAt = Number.isFinite(expiresAtSeconds)
    ? expiresAtSeconds * 1000
    : (Number.isFinite(expiresInSeconds) ? Date.now() + (expiresInSeconds * 1000) : 0);

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
};

const supabaseSignUp = async (email, password) => {
  const payload = await supabaseRequest('/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  });

  return {
    user: payload?.user || payload?.session?.user || null,
    session: createSessionFromSupabasePayload(payload),
  };
};

const supabaseSignIn = async (email, password) => {
  const payload = await supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });

  return {
    user: payload?.user || null,
    session: createSessionFromSupabasePayload(payload),
  };
};

const supabaseRefreshSession = async (refreshToken) => {
  const payload = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });

  return {
    user: payload?.user || null,
    session: createSessionFromSupabasePayload(payload),
  };
};

const supabaseGetUser = async (accessToken) => {
  const payload = await supabaseRequest('/auth/v1/user', {
    method: 'GET',
    accessToken,
  });
  return payload && typeof payload === 'object' ? payload : null;
};

const supabaseSignOut = async (accessToken) => {
  await supabaseRequest('/auth/v1/logout', {
    method: 'POST',
    accessToken,
  });
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const getNutritionPanelImage = (product) => product.nutritionImage || product.images[product.images.length - 1];
const upsertMetaByName = (name, content) => {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertMetaByProperty = (property, content) => {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (href) => {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const upsertStructuredData = (payload) => {
  if (typeof document === 'undefined') return;
  const scriptId = 'velure-json-ld';
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
};

const trackEvent = (eventName, payload = {}) => {
  if (typeof window === 'undefined') return;

  const eventPayload = {
    event: eventName,
    ...payload,
    timestamp: new Date().toISOString(),
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload);
  }
};

const submitFormPayload = async (formType, payload) => {
  const endpoint = import.meta.env.VITE_FORMS_ENDPOINT || '/api/forms';
  const challengeToken = import.meta.env.VITE_FORMS_CHALLENGE_TOKEN;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      formType,
      ...payload,
      ...(challengeToken ? { challengeToken } : {}),
      submittedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    let message = 'Unable to submit form right now.';
    try {
      const errorPayload = await response.json();
      if (typeof errorPayload?.error === 'string' && errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // Keep default message when error response is not JSON.
    }

    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    return { ok: true };
  }
};

const copyTextToClipboard = async (text) => {
  if (!text) {
    throw new Error('Nothing to copy.');
  }

  if (
    typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && window.isSecureContext
    && navigator.clipboard?.writeText
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is not available.');
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '-1000px';
  textArea.style.left = '-1000px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, textArea.value.length);

  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error('Copy failed.');
  }
};

const loadStripeJs = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Stripe.js can only be loaded in the browser.'));
  }

  if (window.Stripe) {
    return Promise.resolve(window.Stripe);
  }

  if (!stripeJsPromise) {
    stripeJsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${STRIPE_JS_SRC}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.Stripe) {
            resolve(window.Stripe);
          } else {
            reject(new Error('Stripe.js loaded without Stripe global.'));
          }
        }, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Stripe.js.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = STRIPE_JS_SRC;
      script.async = true;
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe);
          return;
        }
        reject(new Error('Stripe.js loaded without Stripe global.'));
      };
      script.onerror = () => reject(new Error('Failed to load Stripe.js.'));
      document.head.appendChild(script);
    });
  }

  return stripeJsPromise;
};

const loadRewardsProfileFromApi = async (accessToken) => {
  const endpoint = import.meta.env.VITE_REWARDS_ENDPOINT || '/api/rewards';
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to load rewards profile.';
    throw new Error(message);
  }

  return response.json();
};

const syncRewardsProfileToApi = async (accessToken, profile) => {
  const endpoint = import.meta.env.VITE_REWARDS_ENDPOINT || '/api/rewards';
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
    body: JSON.stringify({ profile }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to sync rewards profile.';
    throw new Error(message);
  }

  return response.json();
};

// --- SUB-COMPONENTS ---

const ProductCard = ({ product, openProductDetail }) => (
  <button
    type="button"
    className="group cursor-pointer text-left w-full"
    onClick={() => openProductDetail(product)}
    aria-label={`View details for ${product.name}`}
  >
    <div className="relative overflow-hidden bg-[#1A1A1A] aspect-[4/5] mb-6">
      <img
        src={product.images[0]}
        alt={`${product.name} product image`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
      />
      <div className="absolute top-4 left-4 bg-[#D4AF37] text-[#0B0C0C] text-xs font-bold px-3 py-1 uppercase tracking-wider">{product.tag}</div>
      <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <span className="block w-full text-center bg-[#F9F6F0] text-[#0B0C0C] py-3 font-sans font-bold tracking-wider group-hover:bg-[#D4AF37] transition-colors shadow-lg">
          VIEW RITUAL
        </span>
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-[#F9F6F0] font-serif text-2xl mb-1">{product.name}</h3>
      <p className="text-gray-400 font-sans text-sm mb-2">{product.subtitle}</p>
      <div className="flex justify-center mb-2" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
             <Star key={i} size={12} fill={i < product.rating ? "#D4AF37" : "none"} color={i < product.rating ? "#D4AF37" : "#4b5563"} />
          ))}
      </div>
      <p className="text-[#F9F6F0] font-sans font-medium">${product.price.toFixed(2)}</p>
    </div>
  </button>
);

const ProductDetailView = ({ product, addToCart, onBack, isCartOpen, onShareProduct, onCopyProductLink }) => {
  const [mainImage, setMainImage] = useState(product.images[0]);
  const nutritionImage = getNutritionPanelImage(product);
  const nutritionSpecs = product.nutritionSpecs || null;
  const ingredientText = product.details.ingredients || '';
  const hasOrganicIngredients = /organic/i.test(ingredientText);
  const hasSyntheticFlavoring = /(artificial|flavor)/i.test(ingredientText);
  const hasAddedSweetener = /(sugar|syrup|sucralose|aspartame|stevia)/i.test(ingredientText);
  const cleanLabelClaims = nutritionSpecs?.cleanLabelClaims?.length
    ? nutritionSpecs.cleanLabelClaims
    : [
        hasOrganicIngredients ? 'Organic ingredients listed' : 'No organic claim listed',
        'No GMO ingredients listed',
        hasSyntheticFlavoring ? 'Synthetic flavoring listed' : 'No synthetic flavoring listed',
        hasAddedSweetener ? 'Added sweeteners listed' : 'No added sweeteners listed',
      ];
  const nutritionRows = nutritionSpecs
    ? [
        nutritionSpecs.ingredients ? { label: 'Ingredients', value: nutritionSpecs.ingredients } : null,
        nutritionSpecs.varietals ? { label: 'Varietals', value: nutritionSpecs.varietals } : null,
        nutritionSpecs.manufacturerCountry ? { label: 'Produced In', value: nutritionSpecs.manufacturerCountry } : null,
        nutritionSpecs.region ? { label: 'Region', value: nutritionSpecs.region } : null,
        nutritionSpecs.productAmount ? { label: 'Net Amount', value: nutritionSpecs.productAmount } : null,
        nutritionSpecs.grossWeight ? { label: 'Package Weight', value: nutritionSpecs.grossWeight } : null,
        nutritionSpecs.suggestedUse ? { label: 'Suggested Use', value: nutritionSpecs.suggestedUse } : null,
      ].filter(Boolean)
    : [];
  const detailsRows = [
    { label: 'Origin', value: product.details.origin },
    product.details.roast ? { label: 'Roast', value: product.details.roast } : null,
    product.details.grade ? { label: 'Grade', value: product.details.grade } : null,
    { label: 'Weight', value: product.details.weight },
  ].filter(Boolean);

  useEffect(() => {
    window.scrollTo(0,0);
  }, [product]);

  return (
    <div className="bg-[#0B0C0C] min-h-screen pt-28 md:pt-32 pb-36 md:pb-24 text-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button onClick={onBack} className="flex items-center text-[#D4AF37] mb-8 hover:text-[#F9F6F0] transition-colors font-sans text-sm tracking-widest uppercase">
          <ArrowLeft size={16} className="mr-2" /> Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Section */}
          <div className="flex flex-col gap-6">
            <div className="w-full aspect-[4/5] bg-[#1a1a1a] relative overflow-hidden">
              <img src={mainImage} alt={`${product.name} detail image`} className="w-full h-full object-cover" decoding="async" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  type="button"
                  key={idx} 
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${mainImage === img ? 'border-[#D4AF37]' : 'border-transparent'} hover:border-[#D4AF37]`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:sticky lg:top-28 self-start">
            <span className="text-[#D4AF37] font-sans tracking-[0.2em] text-xs uppercase mb-2 block">{product.category.replace('_', ' ')} Series</span>
            <h1 className="text-4xl md:text-6xl font-serif text-[#F9F6F0] mb-4">{product.name}</h1>
            <p className="text-lg md:text-xl text-gray-400 font-sans mb-6">{product.subtitle}</p>
            <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-6">
              <span className="text-3xl font-serif text-[#D4AF37]">${product.price.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < product.rating ? "#D4AF37" : "none"} color={i < product.rating ? "#D4AF37" : "#4b5563"} />
                ))}
                <span className="text-sm text-gray-500 ml-2">({product.reviews} Reviews)</span>
              </div>
            </div>

            <button
              onClick={() => addToCart(product)}
              className="hidden md:block w-full bg-[#D4AF37] text-[#0B0C0C] py-4 font-sans font-bold tracking-widest uppercase hover:bg-[#b5952f] transition-colors mb-8"
            >
              Add to Cart — ${product.price.toFixed(2)}
            </button>
            <div className="hidden md:grid grid-cols-2 gap-3 mb-8">
              <button
                type="button"
                onClick={() => onShareProduct(product)}
                className="border border-[#D4AF37] text-[#D4AF37] py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                type="button"
                onClick={() => onCopyProductLink(product)}
                className="border border-gray-700 text-[#F9F6F0] py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider hover:border-[#F9F6F0] transition-colors flex items-center justify-center gap-2"
              >
                <Link2 size={14} />
                Copy Link
              </button>
            </div>
            <div className="hidden md:grid grid-cols-1 gap-2 mb-8 text-xs text-gray-400">
              <p className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> Free shipping on orders over $50</p>
              <p className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> 30-day return window on unopened products</p>
              <p className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> Secure checkout processing</p>
            </div>

            <p className="text-gray-300 font-sans leading-relaxed mb-8 whitespace-pre-line">
              {product.description}
            </p>

            <div className="bg-[#151515] p-6 mb-8 border border-gray-800">
              <h3 className="font-serif text-[#D4AF37] mb-4">The Details</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-sans">
                {detailsRows.map((row) => (
                  <li key={row.label} className="flex justify-between border-b border-gray-800 pb-2">
                    <span>{row.label}</span>
                    <span className="text-[#F9F6F0] text-right">{row.value}</span>
                  </li>
                ))}
                <li className="pt-2">
                  <span className="block mb-1">Ingredients</span>
                  <span className="text-[#F9F6F0] leading-snug">{product.details.ingredients}</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#151515] p-6 mb-8 border border-gray-800">
              <h3 className="font-serif text-[#D4AF37] mb-4">Nutrition & Clean Label</h3>
              <div className="grid grid-cols-1 md:grid-cols-[160px,1fr] gap-5 items-start">
                <img
                  src={nutritionImage}
                  alt={`${product.name} nutrition panel`}
                  loading="lazy"
                  decoding="async"
                  className="w-40 h-40 object-cover border border-gray-700"
                />
                <ul className="space-y-2 text-sm text-gray-300 font-sans">
                  {nutritionRows.map((row) => (
                    <li key={row.label} className="flex justify-between border-b border-gray-800 pb-2 gap-3">
                      <span>{row.label}</span>
                      <span className="text-[#F9F6F0] text-right">{row.value}</span>
                    </li>
                  ))}
                  <li className="pt-1">
                    <span className="block mb-2 text-gray-400">Clean Label Claims</span>
                    <div className="flex flex-wrap gap-2">
                      {cleanLabelClaims.map((claim) => (
                        <span key={claim} className="px-2 py-1 border border-gray-700 text-xs text-[#F9F6F0]">
                          {claim}
                        </span>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Nutrition values are shown from verified product specifications and label data.
              </p>
            </div>

            <button 
              onClick={() => addToCart(product)}
              className="md:hidden w-full bg-[#D4AF37] text-[#0B0C0C] py-4 font-sans font-bold tracking-widest uppercase hover:bg-[#b5952f] transition-colors"
            >
              Add to Cart — ${product.price.toFixed(2)}
            </button>
            <div className="md:hidden mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onShareProduct(product)}
                className="border border-[#D4AF37] text-[#D4AF37] py-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                type="button"
                onClick={() => onCopyProductLink(product)}
                className="border border-gray-700 text-[#F9F6F0] py-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Link2 size={14} />
                Copy
              </button>
            </div>
            <div className="md:hidden mt-4 space-y-2">
              <p className="text-center text-xs text-gray-500">Free shipping on orders over $50</p>
              <p className="text-center text-xs text-gray-500">Secure checkout processing</p>
            </div>
          </div>
        </div>
      </div>

      {!isCartOpen && (
      <div className="fixed md:hidden bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-[#0B0C0C]/95 backdrop-blur-sm px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wider truncate">{product.name}</p>
            <p className="text-lg font-serif text-[#D4AF37]">${product.price.toFixed(2)}</p>
          </div>
          <button
            onClick={() => addToCart(product)}
            className="bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-sm font-bold tracking-widest uppercase whitespace-nowrap hover:bg-[#b5952f] transition-colors"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => onShareProduct(product)}
            className="border border-[#D4AF37] text-[#D4AF37] p-3 hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-colors"
            aria-label={`Share ${product.name}`}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

const Navigation = ({ currentView, cartCount, setView, toggleCart, authUser, onSignOut, onSharePage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (viewName) => {
    setView(viewName);
    setMobileMenuOpen(false);
  };

  const handleShare = async () => {
    if (typeof onSharePage === 'function') {
      await onSharePage();
    }
    setMobileMenuOpen(false);
  };

  const isTransparent = currentView === 'home' && !isScrolled;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent py-6' : 'bg-[#0B0C0C] shadow-lg py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <button
          type="button"
          className="md:hidden text-[#F9F6F0]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <button type="button" className="h-10 md:h-12 w-auto cursor-pointer" onClick={() => handleNav('home')} aria-label="Go to homepage">
           <svg 
             xmlns="http://www.w3.org/2000/svg" 
             viewBox="0 0 232.5 89.249998" 
             className="h-full w-auto"
             preserveAspectRatio="xMidYMid meet" 
             version="1.0"
           >
             <defs><g/></defs>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(19.879835, 56.643997)">
                 <path d="M 0 -31.03125 L 14.828125 -31.03125 L 23.578125 -14.65625 C 24.046875 -15.269531 24.445312 -16.015625 24.78125 -16.890625 C 25.113281 -17.765625 25.28125 -18.550781 25.28125 -19.25 C 25.28125 -20.25 25.03125 -21.175781 24.53125 -22.03125 C 24.03125 -22.894531 23.453125 -23.726562 22.796875 -24.53125 C 22.148438 -25.34375 21.578125 -26.171875 21.078125 -27.015625 C 20.578125 -27.859375 20.328125 -28.753906 20.328125 -29.703125 C 20.328125 -30.085938 20.4375 -30.40625 20.65625 -30.65625 C 20.882812 -30.90625 21.109375 -31.03125 21.328125 -31.03125 L 34.078125 -31.03125 L 16.953125 0.828125 Z M 0 -31.03125 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(49.784528, 56.643997)">
                 <path d="M 18.375 0.828125 C 15.789062 0.828125 13.421875 0.441406 11.265625 -0.328125 C 9.117188 -1.109375 7.242188 -2.21875 5.640625 -3.65625 C 4.046875 -5.101562 2.8125 -6.832031 1.9375 -8.84375 C 1.0625 -10.863281 0.625 -13.09375 0.625 -15.53125 C 0.625 -18.8125 1.300781 -21.679688 2.65625 -24.140625 C 4.019531 -26.597656 5.929688 -28.503906 8.390625 -29.859375 C 10.847656 -31.222656 13.71875 -31.90625 17 -31.90625 C 18.71875 -31.90625 20.378906 -31.691406 21.984375 -31.265625 C 23.597656 -30.835938 25.050781 -30.15625 26.34375 -29.21875 C 27.632812 -28.289062 28.660156 -27.085938 29.421875 -25.609375 C 30.191406 -24.140625 30.578125 -22.351562 30.578125 -20.25 C 30.578125 -18.664062 30.285156 -17.238281 29.703125 -15.96875 C 29.117188 -14.707031 28.328125 -13.625 27.328125 -12.71875 C 26.328125 -11.820312 25.210938 -11.132812 23.984375 -10.65625 C 22.765625 -10.1875 21.503906 -9.953125 20.203125 -9.953125 C 19.398438 -9.953125 18.585938 -10.039062 17.765625 -10.21875 C 16.941406 -10.40625 16.15625 -10.632812 15.40625 -10.90625 C 16.019531 -9.300781 16.9375 -8.0625 18.15625 -7.1875 C 19.382812 -6.3125 20.957031 -5.875 22.875 -5.875 C 23.539062 -5.875 24.238281 -6.023438 24.96875 -6.328125 C 25.707031 -6.640625 26.410156 -7.035156 27.078125 -7.515625 C 27.742188 -8.003906 28.304688 -8.53125 28.765625 -9.09375 C 29.222656 -9.664062 29.476562 -10.21875 29.53125 -10.75 C 30.195312 -10.53125 30.648438 -9.992188 30.890625 -9.140625 C 31.128906 -8.296875 31.101562 -7.3125 30.8125 -6.1875 C 30.519531 -5.0625 29.894531 -3.960938 28.9375 -2.890625 C 27.976562 -1.828125 26.628906 -0.941406 24.890625 -0.234375 C 23.148438 0.472656 20.976562 0.828125 18.375 0.828125 Z M 14.90625 -12.625 C 15.851562 -13.207031 16.6875 -14.175781 17.40625 -15.53125 C 18.132812 -16.894531 18.707031 -18.457031 19.125 -20.21875 C 19.539062 -21.988281 19.75 -23.71875 19.75 -25.40625 C 19.75 -26.96875 19.566406 -28.066406 19.203125 -28.703125 C 18.835938 -29.335938 18.445312 -29.65625 18.03125 -29.65625 C 17.445312 -29.65625 16.925781 -29.304688 16.46875 -28.609375 C 16.007812 -27.921875 15.632812 -26.984375 15.34375 -25.796875 C 15.050781 -24.617188 14.828125 -23.296875 14.671875 -21.828125 C 14.523438 -20.359375 14.453125 -18.859375 14.453125 -17.328125 C 14.453125 -16.460938 14.492188 -15.640625 14.578125 -14.859375 C 14.660156 -14.085938 14.769531 -13.34375 14.90625 -12.625 Z M 14.90625 -12.625 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(81.271925, 56.643997)">
                 <path d="M 1.25 -41.65625 L 15.53125 -41.65625 L 15.53125 -7.875 C 15.53125 -6.707031 15.679688 -5.550781 15.984375 -4.40625 C 16.296875 -3.269531 16.785156 -2.367188 17.453125 -1.703125 C 16.835938 -1.035156 15.988281 -0.445312 14.90625 0.0625 C 13.820312 0.570312 12.613281 0.828125 11.28125 0.828125 C 8.007812 0.828125 5.519531 -0.113281 3.8125 -2 C 2.101562 -3.882812 1.25 -6.726562 1.25 -10.53125 Z M 1.25 -41.65625 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(98.098519, 56.643997)">
                 <path d="M 1.25 -31.03125 L 16.28125 -31.03125 L 16.28125 -7.296875 C 16.28125 -6.128906 16.367188 -5.160156 16.546875 -4.390625 C 16.734375 -3.628906 17.226562 -3.25 18.03125 -3.25 C 18.613281 -3.25 19.03125 -3.460938 19.28125 -3.890625 C 19.53125 -4.328125 19.675781 -4.859375 19.71875 -5.484375 C 19.757812 -6.109375 19.78125 -6.710938 19.78125 -7.296875 L 19.78125 -31.03125 L 34.78125 -31.03125 L 34.78125 0 L 19.78125 0 L 19.78125 -1.875 C 18.84375 -1.125 17.648438 -0.488281 16.203125 0.03125 C 14.753906 0.5625 13.0625 0.828125 11.125 0.828125 C 9.289062 0.828125 7.738281 0.546875 6.46875 -0.015625 C 5.207031 -0.585938 4.195312 -1.351562 3.4375 -2.3125 C 2.675781 -3.269531 2.117188 -4.332031 1.765625 -5.5 C 1.421875 -6.664062 1.25 -7.832031 1.25 -9 Z M 1.25 -31.03125 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(134.125766, 56.643997)">
                 <path d="M 1.25 0 L 1.25 -31.03125 L 16.25 -31.03125 L 16.25 -20.828125 C 16.25 -22.128906 16.488281 -23.425781 16.96875 -24.71875 C 17.457031 -26.007812 18.148438 -27.195312 19.046875 -28.28125 C 19.953125 -29.363281 21.015625 -30.226562 22.234375 -30.875 C 23.460938 -31.53125 24.828125 -31.859375 26.328125 -31.859375 C 27.378906 -31.859375 28.378906 -31.625 29.328125 -31.15625 C 30.273438 -30.6875 30.875 -30.175781 31.125 -29.625 L 25.65625 -10.578125 L 25.25 -10.578125 C 25.25 -11.742188 25.101562 -12.929688 24.8125 -14.140625 C 24.519531 -15.347656 24.09375 -16.457031 23.53125 -17.46875 C 22.976562 -18.488281 22.3125 -19.300781 21.53125 -19.90625 C 20.757812 -20.519531 19.898438 -20.828125 18.953125 -20.828125 C 18.085938 -20.828125 17.421875 -20.578125 16.953125 -20.078125 C 16.484375 -19.578125 16.25 -19.035156 16.25 -18.453125 L 16.25 0 Z M 1.25 0 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(163.155814, 56.643997)">
                 <path d="M 18.375 0.828125 C 15.789062 0.828125 13.421875 0.441406 11.265625 -0.328125 C 9.117188 -1.109375 7.242188 -2.21875 5.640625 -3.65625 C 4.046875 -5.101562 2.8125 -6.832031 1.9375 -8.84375 C 1.0625 -10.863281 0.625 -13.09375 0.625 -15.53125 C 0.625 -18.8125 1.300781 -21.679688 2.65625 -24.140625 C 4.019531 -26.597656 5.929688 -28.503906 8.390625 -29.859375 C 10.847656 -31.222656 13.71875 -31.90625 17 -31.90625 C 18.71875 -31.90625 20.378906 -31.691406 21.984375 -31.265625 C 23.597656 -30.835938 25.050781 -30.15625 26.34375 -29.21875 C 27.632812 -28.289062 28.660156 -27.085938 29.421875 -25.609375 C 30.191406 -24.140625 30.578125 -22.351562 30.578125 -20.25 C 30.578125 -18.664062 30.285156 -17.238281 29.703125 -15.96875 C 29.117188 -14.707031 28.328125 -13.625 27.328125 -12.71875 C 26.328125 -11.820312 25.210938 -11.132812 23.984375 -10.65625 C 22.765625 -10.1875 21.503906 -9.953125 20.203125 -9.953125 C 19.398438 -9.953125 18.585938 -10.039062 17.765625 -10.21875 C 16.941406 -10.40625 16.15625 -10.632812 15.40625 -10.90625 C 16.019531 -9.300781 16.9375 -8.0625 18.15625 -7.1875 C 19.382812 -6.3125 20.957031 -5.875 22.875 -5.875 C 23.539062 -5.875 24.238281 -6.023438 24.96875 -6.328125 C 25.707031 -6.640625 26.410156 -7.035156 27.078125 -7.515625 C 27.742188 -8.003906 28.304688 -8.53125 28.765625 -9.09375 C 29.222656 -9.664062 29.476562 -10.21875 29.53125 -10.75 C 30.195312 -10.53125 30.648438 -9.992188 30.890625 -9.140625 C 31.128906 -8.296875 31.101562 -7.3125 30.8125 -6.1875 C 30.519531 -5.0625 29.894531 -3.960938 28.9375 -2.890625 C 27.976562 -1.828125 26.628906 -0.941406 24.890625 -0.234375 C 23.148438 0.472656 20.976562 0.828125 18.375 0.828125 Z M 14.90625 -12.625 C 15.851562 -13.207031 16.6875 -14.175781 17.40625 -15.53125 C 18.132812 -16.894531 18.707031 -18.457031 19.125 -20.21875 C 19.539062 -21.988281 19.75 -23.71875 19.75 -25.40625 C 19.75 -26.96875 19.566406 -28.066406 19.203125 -28.703125 C 18.835938 -29.335938 18.445312 -29.65625 18.03125 -29.65625 C 17.445312 -29.65625 16.925781 -29.304688 16.46875 -28.609375 C 16.007812 -27.921875 15.632812 -26.984375 15.34375 -25.796875 C 15.050781 -24.617188 14.828125 -23.296875 14.671875 -21.828125 C 14.523438 -20.359375 14.453125 -18.859375 14.453125 -17.328125 C 14.453125 -16.460938 14.492188 -15.640625 14.578125 -14.859375 C 14.660156 -14.085938 14.769531 -13.34375 14.90625 -12.625 Z M 14.90625 -12.625 "/>
               </g>
             </g>
             <g fill="#f9f6f0" fillOpacity="1">
               <g transform="translate(194.692217, 56.643997)">
                 <path d="M 1.25 -5.296875 C 1.25 -7.097656 1.8125 -8.5625 2.9375 -9.6875 C 4.0625 -10.8125 5.539062 -11.375 7.375 -11.375 C 9.175781 -11.375 10.640625 -10.8125 11.765625 -9.6875 C 12.890625 -8.5625 13.453125 -7.097656 13.453125 -5.296875 C 13.453125 -3.460938 12.890625 -1.984375 11.765625 -0.859375 C 10.640625 0.265625 9.175781 0.828125 7.375 0.828125 C 5.539062 0.828125 4.0625 0.265625 2.9375 -0.859375 C 1.8125 -1.984375 1.25 -3.460938 1.25 -5.296875 Z M 1.25 -5.296875 "/>
               </g>
             </g>
           </svg>
        </button>

        <div className="hidden md:flex space-x-8 text-sm font-sans tracking-widest text-[#F9F6F0] opacity-80">
          <button onClick={() => handleNav('shop_all')} className="hover:text-[#D4AF37] transition-colors uppercase">Shop</button>
          <button onClick={() => handleNav('rewards')} className="hover:text-[#D4AF37] transition-colors uppercase">Rewards</button>
          <button onClick={() => handleNav('about')} className="hover:text-[#D4AF37] transition-colors uppercase">Our Story</button>
          <button onClick={() => handleNav('subscription')} className="hover:text-[#D4AF37] transition-colors uppercase">Subscription</button>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-[#F9F6F0] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
            onClick={handleShare}
            aria-label="Share this page"
          >
            <Share2 size={20} />
            <span className="hidden md:inline text-xs uppercase tracking-widest">
              Share
            </span>
          </button>

          <button
            type="button"
            className="text-[#F9F6F0] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
            onClick={() => handleNav('account')}
            aria-label={authUser ? 'Open account' : 'Log in or sign up'}
          >
            <User size={20} />
            <span className="hidden md:inline text-xs uppercase tracking-widest">
              {authUser ? 'Account' : 'Login'}
            </span>
          </button>

          {authUser && (
            <button
              type="button"
              className="text-[#F9F6F0] hover:text-[#D4AF37] transition-colors"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          )}

          <button
            type="button"
            className="relative cursor-pointer text-[#F9F6F0] hover:text-[#D4AF37] transition-colors"
            onClick={toggleCart}
            aria-label={`Open cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-[#0B0C0C] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

	      {mobileMenuOpen && (
	        <div id="mobile-navigation" className="absolute top-full left-0 w-full bg-[#0B0C0C] border-t border-gray-800 p-6 md:hidden flex flex-col space-y-4 shadow-2xl z-50">
	           <button onClick={() => handleNav('shop_all')} className="text-[#F9F6F0] text-left font-sans tracking-widest">SHOP</button>
	           <button onClick={() => handleNav('rewards')} className="text-[#F9F6F0] text-left font-sans tracking-widest">REWARDS</button>
	           <button onClick={() => handleNav('about')} className="text-[#F9F6F0] text-left font-sans tracking-widest">OUR STORY</button>
           <button onClick={() => handleNav('subscription')} className="text-[#F9F6F0] text-left font-sans tracking-widest">SUBSCRIPTION</button>
           <button onClick={() => handleNav('contact')} className="text-[#F9F6F0] text-left font-sans tracking-widest">CONTACT</button>
           <button type="button" onClick={handleShare} className="text-[#F9F6F0] text-left font-sans tracking-widest">SHARE THIS PAGE</button>
           <button onClick={() => handleNav('account')} className="text-[#F9F6F0] text-left font-sans tracking-widest">
             {authUser ? 'ACCOUNT' : 'LOGIN / SIGN UP'}
           </button>
           {authUser && (
             <button
               type="button"
               onClick={onSignOut}
               className="text-[#D4AF37] text-left font-sans tracking-widest"
             >
               SIGN OUT
             </button>
           )}
	        </div>
	      )}
    </nav>
  );
};

const CartDrawer = ({
  isOpen,
  closeCart,
  cart,
  removeFromCart,
  rewardsProfile,
  onRedeemReward,
  onRemoveReward,
  onProceedToCheckout,
}) => {
  const drawerRef = useRef(null);
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const pricing = getCheckoutPricing(subtotal, rewardsProfile.activeRewardId);
  const activeReward = getRewardOffer(rewardsProfile.activeRewardId);
  const [rewardStatus, setRewardStatus] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousActiveElement = document.activeElement;
    const focusableElements = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCart();
        return;
      }

      if (event.key === 'Tab' && focusableElements?.length) {
        if (event.shiftKey && document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        } else if (!event.shiftKey && document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [closeCart, isOpen]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (typeof onProceedToCheckout === 'function') {
      onProceedToCheckout();
    }
  };

  const handleApplyReward = (rewardId) => {
    const result = onRedeemReward(rewardId);
    setRewardStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  const handleRemoveReward = () => {
    const result = onRemoveReward();
    setRewardStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <div className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <button type="button" className="absolute inset-0 bg-black/50" onClick={closeCart} aria-label="Close cart drawer" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`relative w-full max-w-md bg-[#F9F6F0] h-full shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        <div className="p-6 bg-[#0B0C0C] text-[#F9F6F0] flex justify-between items-center">
          <h2 id="cart-drawer-title" className="font-serif text-xl tracking-widest">YOUR RITUAL</h2>
          <button type="button" onClick={closeCart} aria-label="Close cart">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 font-sans mt-10">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 border-b border-gray-200 pb-4">
                  <div className="w-20 h-20 bg-gray-200 overflow-hidden">
                    <img src={item.images[0]} alt={`${item.name} in cart`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-[#0B0C0C] font-bold">{item.name}</h3>
                      <button type="button" onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${item.name} from cart`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-sans">{item.subtitle}</p>
                    <p className="text-sm font-bold text-[#0B0C0C] mt-2">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-200">
          <div className="mb-4 p-4 bg-[#F4F0E7] border border-[#e2d9c4]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-gray-600">Rewards Wallet</p>
              <p className="text-sm font-bold text-[#0B0C0C]">{rewardsProfile.points} pts</p>
            </div>

            {!rewardsProfile.enrolled && (
              <p className="text-xs text-gray-600 mb-3">
                Join rewards from the Rewards page to unlock instant redemptions.
              </p>
            )}

            {activeReward ? (
              <div className="border border-[#D4AF37] bg-white p-3">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Active Reward</p>
                <p className="text-sm font-bold text-[#0B0C0C]">{activeReward.name}</p>
                <button
                  type="button"
                  onClick={handleRemoveReward}
                  className="mt-2 text-xs font-bold uppercase tracking-wider text-[#0B0C0C] underline underline-offset-2"
                >
                  Remove Reward
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {REWARD_OFFERS.map((offer) => (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => handleApplyReward(offer.id)}
                    disabled={!rewardsProfile.enrolled || rewardsProfile.points < offer.pointsCost || cart.length === 0}
                    className="text-left border border-gray-300 p-3 text-xs uppercase tracking-wide font-bold text-[#0B0C0C] enabled:hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {offer.name} - {offer.pointsCost} pts
                  </button>
                ))}
              </div>
            )}

            {rewardStatus.message && (
              <p className={`mt-3 text-xs ${rewardStatus.type === 'error' ? 'text-red-600' : 'text-green-700'}`} role="status">
                {rewardStatus.message}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="font-sans text-gray-600">Subtotal</span>
            <span className="font-serif text-xl font-bold text-[#0B0C0C]">${pricing.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-sans text-gray-600">Shipping</span>
            <span className="font-sans font-semibold text-[#0B0C0C]">${pricing.shipping.toFixed(2)}</span>
          </div>
          {pricing.rewardDiscount > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="font-sans text-gray-600">Rewards Discount</span>
              <span className="font-sans font-semibold text-green-700">-${pricing.rewardDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4 border-t border-gray-200 pt-3">
            <span className="font-sans text-gray-700 uppercase tracking-wide text-xs">Total</span>
            <span className="font-serif text-2xl font-bold text-[#0B0C0C]">${pricing.total.toFixed(2)}</span>
          </div>
          <button 
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full bg-[#0B0C0C] text-[#D4AF37] py-4 font-sans font-bold tracking-widest transition-colors ${(cart.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#222]'}`}
          >
            {`CONTINUE TO CHECKOUT — $${pricing.total.toFixed(2)}`}
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">
            Processed securely by Stripe Checkout. Earn {Math.floor((pricing.subtotal - pricing.rewardDiscount) * REWARDS_POINTS_PER_DOLLAR)} pts on this order.
          </p>
        </div>

      </div>
    </div>
  );
};

const CheckoutView = ({
  cart,
  rewardsProfile,
  authUser,
  setView,
  onOpenCart,
  onCheckoutSuccess,
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const pricing = getCheckoutPricing(subtotal, rewardsProfile.activeRewardId);
  const [customerEmail, setCustomerEmail] = useState(authUser?.email || rewardsProfile.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmbeddedBooting, setIsEmbeddedBooting] = useState(false);
  const [isEmbeddedMounted, setIsEmbeddedMounted] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const [embeddedClientSecret, setEmbeddedClientSecret] = useState('');
  const [embeddedSessionId, setEmbeddedSessionId] = useState('');
  const embeddedContainerRef = useRef(null);
  const embeddedCheckoutRef = useRef(null);
  const pendingCheckoutPayloadRef = useRef(null);
  const checkoutMetricsRef = useRef({ total: pricing.total, itemCount: cart.length });
  const hasProcessedCheckoutRef = useRef(false);
  const sessionRequestKeyRef = useRef('');

  const checkoutItems = getCheckoutItemsFromCart(cart)
    .map((entry) => {
      const product = PRODUCTS.find((item) => item.id === entry.productId);
      if (!product) return null;
      return {
        ...entry,
        name: product.name,
        subtitle: product.subtitle,
        price: product.price,
      };
    })
    .filter(Boolean);

  const checkoutRequestKey = checkoutItems.length
    ? `${checkoutItems.map((item) => `${item.productId}:${item.quantity}`).join('|')}|reward:${rewardsProfile.activeRewardId || 'none'}`
    : '';

  useEffect(() => {
    checkoutMetricsRef.current = {
      total: pricing.total,
      itemCount: cart.length,
    };
  }, [cart.length, pricing.total]);

  useEffect(() => {
    if (cart.length !== 0) return;
    sessionRequestKeyRef.current = '';
    setEmbeddedClientSecret('');
    setEmbeddedSessionId('');
  }, [cart.length]);

  useEffect(() => {
    if (cart.length === 0) return;
    if (!STRIPE_PUBLISHABLE_KEY) {
      setCheckoutError('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
    }
  }, [cart.length]);

  useEffect(() => {
    if (!customerEmail && (authUser?.email || rewardsProfile.email)) {
      setCustomerEmail(authUser?.email || rewardsProfile.email || '');
    }
  }, [authUser?.email, rewardsProfile.email, customerEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (!status) return;

    if (status === 'success') {
      let shouldTrackPurchase = false;
      if (!hasProcessedCheckoutRef.current) {
        try {
          const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY);
          if (raw) {
            const checkoutPayload = JSON.parse(raw);
            pendingCheckoutPayloadRef.current = checkoutPayload;
            if (typeof onCheckoutSuccess === 'function') {
              onCheckoutSuccess(checkoutPayload);
            }
            window.sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Failed to process post-checkout payload', error);
        }
        hasProcessedCheckoutRef.current = true;
        shouldTrackPurchase = true;
      }

      setCheckoutNotice('Payment completed. Thank you for your order.');
      if (shouldTrackPurchase) {
        const paidTotal = Number(pendingCheckoutPayloadRef.current?.total || checkoutMetricsRef.current.total || 0);
        trackEvent('purchase', {
          currency: 'USD',
          value: Number(paidTotal.toFixed(2)),
          item_count: checkoutMetricsRef.current.itemCount,
        });
      }
      setEmbeddedClientSecret('');
      setEmbeddedSessionId(params.get('session_id') || embeddedSessionId);
    } else if (status === 'cancelled') {
      setCheckoutNotice('Checkout was cancelled. Your cart is still saved.');
      trackEvent('checkout_cancelled');
    }

    params.delete('checkout');
    const cleanedQuery = params.toString();
    const cleanedUrl = `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ''}`;
    window.history.replaceState(window.history.state, '', cleanedUrl);
  }, [embeddedSessionId, onCheckoutSuccess]);

  useEffect(() => {
    if (!embeddedClientSecret) return undefined;

    let cancelled = false;
    const mountEmbeddedCheckout = async () => {
      setCheckoutError('');
      setIsEmbeddedBooting(true);

      try {
        if (!STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
        }

        const StripeConstructor = await loadStripeJs();
        const stripe = StripeConstructor(STRIPE_PUBLISHABLE_KEY);
        if (!stripe || typeof stripe.initEmbeddedCheckout !== 'function') {
          throw new Error('Embedded Stripe checkout is not available.');
        }

        const embeddedCheckout = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => embeddedClientSecret,
          onComplete: () => {
            if (hasProcessedCheckoutRef.current) return;
            hasProcessedCheckoutRef.current = true;

            try {
              const checkoutPayload = pendingCheckoutPayloadRef.current;
              if (checkoutPayload && typeof onCheckoutSuccess === 'function') {
                onCheckoutSuccess(checkoutPayload);
              }
              window.sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
            } catch (error) {
              console.error('Failed to finalize checkout payload', error);
            }

            const paidTotal = Number(pendingCheckoutPayloadRef.current?.total || checkoutMetricsRef.current.total || 0);
            setCheckoutNotice('Payment completed. Thank you for your order.');
            trackEvent('purchase', {
              currency: 'USD',
              value: Number(paidTotal.toFixed(2)),
              item_count: checkoutMetricsRef.current.itemCount,
            });
          },
        });

        if (cancelled) {
          embeddedCheckout.destroy();
          return;
        }

        if (!embeddedContainerRef.current) {
          embeddedCheckout.destroy();
          throw new Error('Checkout container is not available.');
        }

        embeddedCheckout.mount(embeddedContainerRef.current);
        embeddedCheckoutRef.current = embeddedCheckout;
        setIsEmbeddedMounted(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize Stripe checkout.';
        setCheckoutError(message);
        setEmbeddedClientSecret('');
        setEmbeddedSessionId('');
      } finally {
        if (!cancelled) {
          setIsEmbeddedBooting(false);
        }
      }
    };

    mountEmbeddedCheckout();

    return () => {
      cancelled = true;
      const checkout = embeddedCheckoutRef.current;
      if (checkout && typeof checkout.destroy === 'function') {
        checkout.destroy();
      }
      embeddedCheckoutRef.current = null;
      setIsEmbeddedMounted(false);
    };
  }, [embeddedClientSecret, onCheckoutSuccess]);

  const resetEmbeddedCheckout = () => {
    const checkout = embeddedCheckoutRef.current;
    if (checkout && typeof checkout.destroy === 'function') {
      checkout.destroy();
    }
    embeddedCheckoutRef.current = null;
    setEmbeddedClientSecret('');
    setEmbeddedSessionId('');
    setIsEmbeddedMounted(false);
    setIsEmbeddedBooting(false);
    sessionRequestKeyRef.current = '';
    hasProcessedCheckoutRef.current = false;
  };

  const handleStartStripeCheckout = useCallback(async ({ force = false } = {}) => {
    if (cart.length === 0 || (!force && (isSubmitting || isEmbeddedBooting))) return;
    setCheckoutError('');
    if (force) {
      setCheckoutNotice('');
    }

    const normalizedEmail = customerEmail.trim().toLowerCase();
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      setCheckoutError('Please enter a valid email address.');
      return;
    }

    if (!STRIPE_PUBLISHABLE_KEY) {
      setCheckoutError('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setIsSubmitting(true);
    hasProcessedCheckoutRef.current = false;

    trackEvent('checkout_submit', {
      currency: 'USD',
      value: Number(pricing.total.toFixed(2)),
      item_count: cart.length,
      reward_id: rewardsProfile.activeRewardId || undefined,
    });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          items: getCheckoutItemsFromCart(cart),
          rewardId: rewardsProfile.activeRewardId || null,
          customerEmail: normalizedEmail || undefined,
          uiMode: 'embedded',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to start checkout right now.');
      }

      const checkoutProvider = typeof payload.provider === 'string' ? payload.provider.toLowerCase() : '';
      if (checkoutProvider !== 'stripe') {
        throw new Error('Stripe checkout is not available right now.');
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
      }
      pendingCheckoutPayloadRef.current = payload;

      if (payload?.uiMode === 'embedded' && payload?.clientSecret) {
        setEmbeddedSessionId(typeof payload.checkoutSessionId === 'string' ? payload.checkoutSessionId : '');
        setEmbeddedClientSecret(payload.clientSecret);
        sessionRequestKeyRef.current = checkoutRequestKey;
      } else if (payload?.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
      } else {
        throw new Error('Stripe checkout response is incomplete.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout right now.';
      setCheckoutError(message);
      trackEvent('checkout_error', { message });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cart,
    checkoutRequestKey,
    customerEmail,
    isEmbeddedBooting,
    isSubmitting,
    pricing.total,
    rewardsProfile.activeRewardId,
  ]);

  useEffect(() => {
    if (!checkoutRequestKey || cart.length === 0) return;
    if (sessionRequestKeyRef.current === checkoutRequestKey) return;
    if (!STRIPE_PUBLISHABLE_KEY) return;

    sessionRequestKeyRef.current = checkoutRequestKey;
    handleStartStripeCheckout();
  }, [cart.length, checkoutRequestKey, handleStartStripeCheckout]);

  const isEmbeddedActive = Boolean(embeddedClientSecret || isEmbeddedMounted || isEmbeddedBooting);

  return (
    <div className="pt-28 pb-20 bg-[#F9F6F0] min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <button
          type="button"
          onClick={() => setView('shop_all')}
          className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-[#0B0C0C] hover:text-[#2D2D2D]"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </button>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8">
          <section className="bg-white border border-gray-200 p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-serif text-[#0B0C0C]">Checkout</h1>
              <button
                type="button"
                onClick={onOpenCart}
                className="text-xs uppercase tracking-widest font-bold text-[#0B0C0C] border border-[#0B0C0C] px-3 py-2 hover:bg-[#0B0C0C] hover:text-[#F9F6F0]"
              >
                Edit Cart
              </button>
            </div>

            {checkoutNotice && (
              <p className="mb-4 border border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm" role="status">
                {checkoutNotice}
              </p>
            )}

            {checkoutItems.length === 0 ? (
              <div className="border border-dashed border-gray-300 bg-[#fafafa] p-8 text-center">
                <p className="text-gray-600">Your cart is empty.</p>
                <button
                  type="button"
                  onClick={() => setView('shop_all')}
                  className="mt-4 bg-[#0B0C0C] text-[#D4AF37] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#1b1d1d]"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {checkoutItems.map((item) => (
                    <div key={item.productId} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                      <div>
                        <p className="font-serif text-lg text-[#0B0C0C]">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.subtitle}</p>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">Qty {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#0B0C0C]">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-[#0B0C0C]">${pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-[#0B0C0C]">${pricing.shipping.toFixed(2)}</span>
                  </div>
                  {pricing.rewardDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rewards Discount</span>
                      <span className="font-semibold text-green-700">-${pricing.rewardDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
                    <span className="text-xs uppercase tracking-wider text-gray-700">Total</span>
                    <span className="font-serif text-2xl text-[#0B0C0C]">${pricing.total.toFixed(2)}</span>
                  </div>
                </div>

                {embeddedSessionId && (
                  <p className="mt-4 text-xs text-gray-500">
                    Session: {embeddedSessionId}
                  </p>
                )}
              </>
            )}
          </section>

          <section className="bg-[#0B0C0C] text-[#F9F6F0] p-6 md:p-8">
            <h2 className="font-serif text-2xl mb-3">Secure Payment</h2>
            <p className="text-sm text-gray-300 mb-6">
              Complete payment directly on this page. Stripe securely collects checkout details including email, phone, billing/shipping address, and country.
            </p>

            {!isEmbeddedActive && (
              <div className="rounded-sm border border-white/15 bg-white/5 p-4 min-h-[120px] flex items-center">
                <p className="text-sm text-gray-300">
                  {cart.length === 0
                    ? 'Add items to cart to begin checkout.'
                    : (isSubmitting ? 'Preparing secure checkout...' : 'Loading secure checkout...')
                  }
                </p>
              </div>
            )}

            {isEmbeddedActive && (
              <div className="space-y-4">
                <div className="rounded-sm bg-white p-2 min-h-[420px]">
                  {isEmbeddedBooting && (
                    <p className="text-sm text-[#0B0C0C] px-2 py-2">Loading secure checkout...</p>
                  )}
                  <div ref={embeddedContainerRef} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetEmbeddedCheckout();
                    handleStartStripeCheckout({ force: true });
                  }}
                  className="w-full border border-[#D4AF37] text-[#D4AF37] py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
                >
                  Reload Checkout
                </button>
              </div>
            )}

            {checkoutError && (
              <p className="mt-4 text-sm border border-red-500/40 bg-red-500/10 text-red-200 px-4 py-3" role="alert">
                {checkoutError}
              </p>
            )}

            {!isEmbeddedActive && checkoutError && cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  resetEmbeddedCheckout();
                  handleStartStripeCheckout({ force: true });
                }}
                className="mt-4 w-full border border-[#D4AF37] text-[#D4AF37] py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
              >
                Retry Secure Checkout
              </button>
            )}

            <p className="mt-5 text-xs text-gray-400">
              Powered securely by Stripe.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

const ShopView = ({ category, openProductDetail }) => {
  const filteredProducts = category === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === category);

  const titleMap = {
    'all': 'All Collections',
    'functional': 'Functional Blends',
    'single_origin': 'Single Origin Series',
  };

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-[#F9F6F0] mb-4">{titleMap[category]}</h1>
        <p className="text-gray-400 font-sans mb-12 max-w-2xl">Explore our range of meticulously sourced and roasted coffees, designed to elevate your daily ritual.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} openProductDetail={openProductDetail} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TextView = ({ title, content }) => (
  <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
    <div className="max-w-3xl mx-auto px-6">
      <h1 className="text-4xl font-serif text-[#0B0C0C] mb-8">{title}</h1>
      <div className="prose prose-lg font-sans text-gray-700 whitespace-pre-line">
        {content}
      </div>
    </div>
  </div>
);

const ContactView = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
    website: '',
  });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formState.website) {
      return;
    }

    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setStatus({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    if (!isValidEmail(formState.email)) {
      setStatus({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      await submitFormPayload('contact', {
        name: formState.name.trim(),
        email: formState.email.trim(),
        message: formState.message.trim(),
      });

      trackEvent('generate_lead', { lead_type: 'contact' });
      setStatus({ type: 'success', message: 'Message sent. We will reply shortly.' });
      setFormState({
        name: '',
        email: '',
        message: '',
        website: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to send right now. Please try again.';
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <h1 className="text-4xl font-serif text-[#0B0C0C] mb-6">Contact Us</h1>
          <p className="text-gray-700 font-sans mb-8">Have a question about our sourcing, shipping, or wholesale program? We are here to help.</p>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Mail className="text-[#D4AF37]" />
              <span className="text-[#0B0C0C]">concierge@velureritual.com</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="text-[#D4AF37]" />
              <span className="text-[#0B0C0C]">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="text-[#D4AF37]" />
              <span className="text-[#0B0C0C]">Los Angeles, CA</span>
            </div>
          </div>
        </div>
        <form className="bg-white p-8 shadow-lg" onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="contact-name" className="block text-sm text-[#0B0C0C] font-bold uppercase tracking-widest mb-2">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contact-email" className="block text-sm text-[#0B0C0C] font-bold uppercase tracking-widest mb-2">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="contact-message" className="block text-sm text-[#0B0C0C] font-bold uppercase tracking-widest mb-2">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows="4"
              value={formState.message}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]"
            />
          </div>

          <input
            type="text"
            name="website"
            value={formState.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-[#0B0C0C] text-[#D4AF37] py-4 font-bold tracking-widest uppercase transition-colors ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-800'}`}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>

          {status.message && (
            <p className={`mt-4 text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`} role="status">
              {status.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

const AccountView = ({ authState, onSignIn, onSignUp, onSignOut, setView }) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (!isValidEmail(signInForm.email) || signInForm.password.length < 8) {
      setStatus({ type: 'error', message: 'Enter a valid email and password (8+ characters).' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const result = await onSignIn(signInForm.email, signInForm.password);
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    setIsSubmitting(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (!isValidEmail(signUpForm.email)) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }
    if (signUpForm.password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setStatus({ type: 'error', message: 'Password confirmation does not match.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const result = await onSignUp(signUpForm.email, signUpForm.password);
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) {
      setSignUpForm({ email: signUpForm.email, password: '', confirmPassword: '' });
    }
    setIsSubmitting(false);
  };

  if (authState.isLoading) {
    return (
      <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-gray-300">Loading account...</p>
        </div>
      </div>
    );
  }

  if (authState.user) {
    return (
      <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-serif mb-6">My Account</h1>
          <div className="bg-[#151515] border border-gray-800 p-8">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Signed In</p>
            <p className="text-lg text-[#F9F6F0] break-all">{authState.user.email}</p>
            <p className="text-sm text-gray-400 mt-3">
              Your rewards profile and cart now load under this account on this device.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={() => setView('rewards')}
                className="bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f]"
              >
                Open Rewards
              </button>
              <button
                type="button"
                onClick={() => setView('shop_all')}
                className="border border-[#D4AF37] text-[#D4AF37] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="border border-gray-700 text-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-wider hover:border-red-500 hover:text-red-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl font-serif mb-6">Account Access</h1>
        <p className="text-gray-300 mb-8">
          Create an account or sign in to manage rewards and account-linked activity.
        </p>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border ${activeTab === 'signin' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border ${activeTab === 'signup' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-[#151515] border border-gray-800 p-8">
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} noValidate>
              <div className="space-y-4">
                <input
                  type="email"
                  value={signInForm.email}
                  onChange={(event) => setSignInForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="password"
                  value={signInForm.password}
                  onChange={(event) => setSignInForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-5 bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} noValidate>
              <div className="space-y-4">
                <input
                  type="email"
                  value={signUpForm.email}
                  onChange={(event) => setSignUpForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="password"
                  value={signUpForm.password}
                  onChange={(event) => setSignUpForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Password (min 8 chars)"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="password"
                  value={signUpForm.confirmPassword}
                  onChange={(event) => setSignUpForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Confirm password"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-5 bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {status.message && (
            <p className={`text-sm mt-4 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
              {status.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-6">
            By continuing, you agree to our{' '}
            <button type="button" onClick={() => setView('terms')} className="text-[#D4AF37] underline underline-offset-2">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" onClick={() => setView('privacy')} className="text-[#D4AF37] underline underline-offset-2">
              Privacy Policy
            </button>.
          </p>
        </div>
      </div>
    </div>
  );
};

const RewardsView = ({ setView, rewardsProfile, onJoinRewards, onRedeemReward, onRemoveReward, authUser }) => {
  const [joinEmail, setJoinEmail] = useState(authUser?.email || rewardsProfile.email || '');
  const [isJoining, setIsJoining] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const tier = getRewardsTier(rewardsProfile.lifetimePoints);
  const pointsToNextTier = getPointsToNextTier(rewardsProfile.lifetimePoints);
  const activeReward = getRewardOffer(rewardsProfile.activeRewardId);

  useEffect(() => {
    setJoinEmail(authUser?.email || rewardsProfile.email || '');
  }, [authUser?.email, rewardsProfile.email]);

  const handleJoinRewards = async () => {
    if (!joinEmail.trim() || !isValidEmail(joinEmail)) {
      setStatus({ type: 'error', message: 'Enter a valid email address to join rewards.' });
      return;
    }

    setIsJoining(true);
    setStatus({ type: 'idle', message: '' });
    const normalizedEmail = joinEmail.trim().toLowerCase();

    try {
      await submitFormPayload('newsletter', {
        email: normalizedEmail,
        rewardsProgram: 'enabled',
      });

      const result = onJoinRewards(normalizedEmail);
      setStatus({ type: 'success', message: result.message });
      setJoinEmail(normalizedEmail);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join rewards right now.';
      setStatus({ type: 'error', message });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRedeem = (rewardId) => {
    const result = onRedeemReward(rewardId);
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
  };

  const handleRemoveReward = () => {
    const result = onRemoveReward();
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
  };

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-5xl font-serif mb-4">Velure Rewards App</h1>
        <p className="text-gray-300 text-lg mb-10">
          Your rewards wallet is now active. Earn points on checkout and redeem them instantly for discounts and shipping perks.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#151515] border border-gray-800 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Current Points</p>
            <p className="font-serif text-5xl text-[#D4AF37]">{rewardsProfile.points}</p>
            <p className="text-xs text-gray-500 mt-2">Earn {REWARDS_POINTS_PER_DOLLAR} pts per $1 on checkout subtotal.</p>
          </div>
          <div className="bg-[#151515] border border-gray-800 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Membership Tier</p>
            <p className="font-serif text-4xl">{tier}</p>
            <p className="text-xs text-gray-500 mt-2">
              {pointsToNextTier > 0 ? `${pointsToNextTier} pts to next tier.` : 'Top tier unlocked.'}
            </p>
          </div>
          <div className="bg-[#151515] border border-gray-800 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Rewards Email</p>
            <p className="text-sm text-gray-200 break-all">{authUser?.email || rewardsProfile.email || 'Not enrolled yet'}</p>
            <p className="text-xs text-gray-500 mt-2">Use the same email for rewards and newsletter updates.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#151515] border border-gray-800 p-6">
            <h2 className="font-serif text-3xl mb-4">Join & Redeem</h2>

            {!authUser && (
              <div className="mb-5 p-4 border border-gray-700 bg-[#0B0C0C]">
                <p className="text-sm text-gray-300 mb-3">Sign in to create an account-linked rewards wallet.</p>
                <button
                  type="button"
                  onClick={() => setView('account')}
                  className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
                >
                  Sign In / Sign Up
                </button>
              </div>
            )}

            {!rewardsProfile.enrolled && authUser && (
              <div className="mb-6">
                <label htmlFor="rewards-email" className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Email</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="rewards-email"
                    type="email"
                    value={joinEmail}
                    onChange={(event) => setJoinEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] px-3 py-2 outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleJoinRewards}
                    disabled={isJoining}
                    className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-2 font-bold uppercase tracking-wider ${isJoining ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                  >
                    {isJoining ? 'Joining...' : `Join +${REWARDS_SIGNUP_BONUS} pts`}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
                {REWARD_OFFERS.map((offer) => {
                const disabled = !authUser || !rewardsProfile.enrolled || rewardsProfile.points < offer.pointsCost || Boolean(activeReward);
                return (
                  <div key={offer.id} className="border border-gray-700 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-2xl text-[#D4AF37]">{offer.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{offer.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{offer.pointsCost} points</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRedeem(offer.id)}
                        disabled={disabled}
                        className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wider enabled:hover:bg-[#D4AF37] enabled:hover:text-[#0B0C0C] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeReward && (
              <div className="mt-5 border border-[#D4AF37] bg-[#0B0C0C] p-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Active Reward</p>
                <p className="font-serif text-2xl text-[#D4AF37]">{activeReward.name}</p>
                <p className="text-xs text-gray-400 mt-1">Applied in cart and ready for checkout.</p>
                <button
                  type="button"
                  onClick={handleRemoveReward}
                  className="mt-3 text-xs font-bold uppercase tracking-wider underline underline-offset-2"
                >
                  Remove Reward
                </button>
              </div>
            )}

            {status.message && (
              <p className={`text-sm mt-4 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {status.message}
              </p>
            )}
          </div>

          <div className="bg-[#151515] border border-gray-800 p-6">
            <h2 className="font-serif text-3xl mb-4">Recent Activity</h2>
            {rewardsProfile.history.length === 0 ? (
              <p className="text-sm text-gray-400">No rewards activity yet. Join rewards and place your first order to start earning.</p>
            ) : (
              <div className="space-y-3">
                {rewardsProfile.history.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="border border-gray-700 p-3">
                    <p className="text-sm text-[#F9F6F0]">{entry.description}</p>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      <span className={entry.pointsDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {entry.pointsDelta > 0 ? '+' : ''}{entry.pointsDelta} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 mb-3">
                Participation is governed by our{' '}
                <button type="button" onClick={() => setView('rewards_terms')} className="text-[#D4AF37] hover:text-[#F9F6F0] underline underline-offset-2">
                  Rewards Terms
                </button>.
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setView('shop_all')} className="bg-[#D4AF37] text-[#0B0C0C] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f]">
                  Shop & Earn
                </button>
                <button type="button" onClick={() => setView('contact')} className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]">
                  Rewards Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionView = ({ setView }) => {
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscribingTier, setSubscribingTier] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const handleSubscribe = async (tier) => {
    if (!subscriberEmail.trim() || !isValidEmail(subscriberEmail)) {
      setStatus({ type: 'error', message: 'Enter a valid email to subscribe.' });
      return;
    }

    setSubscribingTier(tier);
    setStatus({ type: 'idle', message: '' });

    try {
      await submitFormPayload('newsletter', {
        email: subscriberEmail.trim(),
        subscriptionTier: `${tier} bag${tier > 1 ? 's' : ''} / month`,
      });

      trackEvent('subscribe_plan', {
        tier,
        value: Number((20 * tier).toFixed(2)),
      });
      setStatus({ type: 'success', message: `Subscribed to ${tier} bag${tier > 1 ? 's' : ''} / month plan updates.` });
      setSubscriberEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to subscribe right now.';
      setStatus({ type: 'error', message });
    } finally {
      setSubscribingTier(null);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-serif text-[#F9F6F0] mb-6">Never Run Out of <br /><span className="text-[#D4AF37] italic">The Ritual</span></h1>
        <p className="text-gray-400 text-lg mb-8">Join the Velure Club. Save 15% on every order and get exclusive access to small-batch roasts.</p>

        <div className="max-w-md mx-auto mb-10">
          <label htmlFor="subscription-email" className="sr-only">Subscription email</label>
          <input
            id="subscription-email"
            type="email"
            value={subscriberEmail}
            onChange={(event) => setSubscriberEmail(event.target.value)}
            placeholder="Enter email to subscribe"
            className="w-full border border-gray-700 bg-[#151515] text-[#F9F6F0] p-3 outline-none focus:border-[#D4AF37]"
          />
          {status.message && (
            <p className={`text-sm mt-3 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
              {status.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            By subscribing, you agree to our{' '}
            <button type="button" onClick={() => setView('subscription_terms')} className="text-[#D4AF37] hover:text-[#F9F6F0] underline underline-offset-2">
              Subscription Terms
            </button>{' '}
            and{' '}
            <button type="button" onClick={() => setView('privacy')} className="text-[#D4AF37] hover:text-[#F9F6F0] underline underline-offset-2">
              Privacy Policy
            </button>.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((tier) => (
            <div key={tier} className="border border-gray-800 p-8 hover:border-[#D4AF37] transition-all cursor-pointer bg-[#151515]">
              <h3 className="font-serif text-2xl mb-2">{tier} Bag{tier > 1 ? 's' : ''} / Month</h3>
              <p className="text-[#D4AF37] font-bold text-xl mb-4">${(20 * tier).toFixed(2)}</p>
              <ul className="text-left text-sm text-gray-400 space-y-2 mb-8">
                <li className="flex gap-2"><Check size={16} /> Free Shipping</li>
                <li className="flex gap-2"><Check size={16} /> Cancel Anytime</li>
                <li className="flex gap-2"><Check size={16} /> Exclusive Access</li>
              </ul>
              <button
                type="button"
                onClick={() => handleSubscribe(tier)}
                disabled={subscribingTier === tier}
                className={`w-full bg-[#F9F6F0] text-[#0B0C0C] py-3 font-bold uppercase tracking-wider hover:bg-[#D4AF37] transition-colors ${subscribingTier === tier ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {subscribingTier === tier ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = ({ setView }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterTrap, setNewsletterTrap] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState({ type: 'idle', message: '' });
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    if (newsletterTrap) {
      return;
    }

    if (!newsletterEmail.trim() || !isValidEmail(newsletterEmail)) {
      setNewsletterStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setIsNewsletterSubmitting(true);
    setNewsletterStatus({ type: 'idle', message: '' });

    try {
      await submitFormPayload('newsletter', { email: newsletterEmail.trim() });
      trackEvent('generate_lead', { lead_type: 'newsletter' });
      setNewsletterStatus({ type: 'success', message: 'You are subscribed.' });
      setNewsletterEmail('');
      setNewsletterTrap('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed. Please try again.';
      setNewsletterStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#050505] text-[#F9F6F0] pt-20 pb-10 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div>
          <h2 className="font-serif text-2xl font-bold mb-6">VELURE</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Small batch, artisan coffee sourced with intention and roasted for the discerning palate.</p>
        </div>
        <div>
          <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Shop</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><button type="button" onClick={() => setView('shop_all')} className="hover:text-[#F9F6F0]">All Coffee</button></li>
            <li><button type="button" onClick={() => setView('shop_functional')} className="hover:text-[#F9F6F0]">Functional Blends</button></li>
            <li><button type="button" onClick={() => setView('shop_single_origin')} className="hover:text-[#F9F6F0]">Single Origin</button></li>
            <li><button type="button" onClick={() => setView('subscription')} className="hover:text-[#F9F6F0]">Subscriptions</button></li>
            <li><button type="button" onClick={() => setView('rewards')} className="hover:text-[#F9F6F0]">Rewards App</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Company</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><button type="button" onClick={() => setView('about')} className="hover:text-[#F9F6F0]">Our Story</button></li>
            <li><button type="button" onClick={() => setView('sourcing')} className="hover:text-[#F9F6F0]">Sourcing</button></li>
            <li><button type="button" onClick={() => setView('wholesale')} className="hover:text-[#F9F6F0]">Wholesale</button></li>
            <li><button type="button" onClick={() => setView('contact')} className="hover:text-[#F9F6F0]">Contact</button></li>
            <li><button type="button" onClick={() => setView('account')} className="hover:text-[#F9F6F0]">Account</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Newsletter</h3>
          <form className="border-b border-gray-700 pb-2" onSubmit={handleNewsletterSubmit} noValidate>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <div className="flex items-center">
              <input
                id="newsletter-email"
                name="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Your email address"
                className="bg-transparent border-none outline-none text-[#F9F6F0] flex-grow placeholder-gray-600 text-sm"
                required
              />
              <button type="submit" disabled={isNewsletterSubmitting} className={`font-bold text-sm uppercase ${isNewsletterSubmitting ? 'text-gray-500' : 'text-[#D4AF37]'}`}>
                {isNewsletterSubmitting ? '...' : 'Join'}
              </button>
            </div>
            <input
              type="text"
              name="company"
              value={newsletterTrap}
              onChange={(event) => setNewsletterTrap(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            {newsletterStatus.message && (
              <p className={`mt-3 text-xs ${newsletterStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {newsletterStatus.message}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              By joining, you agree to our{' '}
              <button type="button" onClick={() => setView('privacy')} className="text-[#D4AF37] hover:text-[#F9F6F0] underline underline-offset-2">
                Privacy Policy
              </button>{' '}
              and{' '}
              <button type="button" onClick={() => setView('subscription_terms')} className="text-[#D4AF37] hover:text-[#F9F6F0] underline underline-offset-2">
                Subscription Terms
              </button>.
            </p>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-900 flex flex-col gap-4 md:flex-row md:justify-between md:items-center text-xs text-gray-600">
        <p>&copy; {new Date().getFullYear()} Velure Coffee Co.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button type="button" onClick={() => setView('privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => setView('terms')}>Terms of Service</button>
          <button type="button" onClick={() => setView('shipping_returns')}>Shipping & Returns</button>
          <button type="button" onClick={() => setView('rewards_terms')}>Rewards Terms</button>
          <button type="button" onClick={() => setView('subscription_terms')}>Subscription Terms</button>
        </div>
      </div>
    </footer>
  );
};

const HomeView = ({ openProductDetail, setView }) => (
  <>
    {/* HERO */}
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#0B0C0C]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-[#0B0C0C] z-10"></div>
      <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80')] bg-cover bg-center"></div>
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <p className="text-[#D4AF37] font-sans tracking-[0.3em] text-sm md:text-base mb-6 uppercase animate-fade-in-up">The Standard of Smooth</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#F9F6F0] mb-8 leading-tight">ELEVATE THE <br /><span className="italic text-[#D4AF37]">RITUAL</span></h1>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button onClick={() => setView('shop_all')} className="bg-[#D4AF37] text-[#0B0C0C] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#b5952f] transition-all transform hover:scale-105">SHOP COLLECTION</button>
          <button onClick={() => setView('about')} className="border border-[#F9F6F0] text-[#F9F6F0] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#F9F6F0] hover:text-[#0B0C0C] transition-all">OUR STORY</button>
        </div>
      </div>
    </div>

    {/* VALUE PROPS */}
    <div className="bg-[#F9F6F0] py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="flex flex-col items-center">
          <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Leaf className="text-[#D4AF37]" size={32} /></div>
          <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Ethically Sourced</h3>
          <p className="font-sans text-gray-600">Direct trade with farmers ensures quality and fair wages.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Award className="text-[#D4AF37]" size={32} /></div>
          <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Small Batch Roast</h3>
          <p className="font-sans text-gray-600">Roasted in limited quantities for peak freshness.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Coffee className="text-[#D4AF37]" size={32} /></div>
          <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Functional Benefits</h3>
          <p className="font-sans text-gray-600">Infused with Lion's Mane for focus and clarity.</p>
        </div>
      </div>
    </div>

    <div className="bg-[#121212] border-y border-gray-800 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <p className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] mb-2">New</p>
          <h3 className="font-serif text-2xl text-[#F9F6F0]">Rewards App + Instant Shipping Rewards</h3>
          <p className="text-gray-400 text-sm mt-2">Collect points and unlock discounts or free shipping faster.</p>
        </div>
        <button type="button" onClick={() => setView('rewards')} className="border border-[#D4AF37] text-[#D4AF37] px-6 py-3 font-sans uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-all">
          Explore Rewards
        </button>
      </div>
    </div>

    {/* FEATURED SHOP */}
    <div className="bg-[#0B0C0C] py-24 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-[#F9F6F0] mb-6">Curated Excellence</h2>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Displaying first 3 products as featured */}
          {PRODUCTS.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} openProductDetail={openProductDetail} />
          ))}
        </div>
        <div className="text-center mt-12">
           <button onClick={() => setView('shop_all')} className="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 font-sans uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-all">View All</button>
        </div>
      </div>
    </div>
  </>
);

const WholesaleView = ({ setView }) => (
  <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
    <div className="max-w-6xl mx-auto px-6">
      <h1 className="text-5xl font-serif text-[#0B0C0C] mb-6">Wholesale & Bulk Orders</h1>
      <p className="text-gray-700 font-sans mb-10 max-w-3xl">
        Yes, Velure can sell in bulk. We support restaurants, hotels, offices, and multi-location chains with sample kits, onboarding, and recurring supply plans.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-serif text-2xl text-[#0B0C0C] mb-2">Starter Bulk</h2>
          <p className="text-sm text-gray-600 mb-3">24-99 units</p>
          <p className="text-sm text-gray-700">Great for test locations and pilot menus.</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-serif text-2xl text-[#0B0C0C] mb-2">Growth Bulk</h2>
          <p className="text-sm text-gray-600 mb-3">100-499 units</p>
          <p className="text-sm text-gray-700">Volume pricing and scheduled restock support.</p>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="font-serif text-2xl text-[#0B0C0C] mb-2">Chain Program</h2>
          <p className="text-sm text-gray-600 mb-3">500+ units</p>
          <p className="text-sm text-gray-700">Custom blends, private label options, and account manager setup.</p>
        </div>
      </div>

      <div className="bg-[#0B0C0C] text-[#F9F6F0] p-8">
        <h3 className="font-serif text-3xl mb-4">Need Samples First?</h3>
        <p className="text-gray-300 mb-6">We can ship sample boxes before full bulk commitment.</p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={() => setView('contact')} className="bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#b5952f] transition-colors">
            Request Samples
          </button>
          <a href="mailto:wholesale@velureritual.com" className="border border-[#D4AF37] text-[#D4AF37] px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-colors">
            Email Wholesale Team
          </a>
        </div>
      </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

const App = () => {
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return { view: 'home', productId: null };
    }

    return getRouteFromPath(window.location.pathname);
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const currentView = route.view;
  const selectedProduct = currentView === 'product_detail'
    ? PRODUCTS.find((product) => product.id === route.productId) || null
    : null;

  const navigateToView = useCallback((view, options = {}) => {
    const normalizedView = view === 'product_detail' && !options.productId ? 'shop_all' : view;
    const productId = options.productId || null;
    const nextPath = getPathForView(normalizedView, { productId });
    const shouldReplace = options.replace === true;

    if (typeof window !== 'undefined') {
      const historyAction = shouldReplace ? 'replaceState' : 'pushState';
      const nextState = { velureBackGuard: true, view: normalizedView, productId };
      if (window.location.pathname !== nextPath || shouldReplace) {
        window.history[historyAction](nextState, '', nextPath);
      }

      if (!options.preserveScroll) {
        window.scrollTo(0, 0);
      }
    }

    setRoute({ view: normalizedView, productId });
  }, []);

  const setView = useCallback((view) => {
    trackEvent('navigation_click', { destination: view });
    navigateToView(view);
  }, [navigateToView]);

  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    if (!shareNotice) return undefined;
    const timeoutId = setTimeout(() => setShareNotice(''), 2400);
    return () => clearTimeout(timeoutId);
  }, [shareNotice]);

  const buildShareUrl = useCallback((path) => {
    if (typeof window === 'undefined') return '';
    if (!path) return window.location.href;

    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return window.location.href;
    }
  }, []);

  const handleShareLink = useCallback(async ({ path, title, text, copyOnly = false } = {}) => {
    const url = buildShareUrl(path);

    if (!url) {
      setShareNotice('Unable to generate link right now.');
      return { ok: false };
    }

    try {
      if (
        !copyOnly
        && typeof navigator !== 'undefined'
        && typeof navigator.share === 'function'
      ) {
        await navigator.share({
          title: title || 'Velure Coffee',
          text: text || 'Check out Velure Coffee.',
          url,
        });
        setShareNotice('Link shared.');
        return { ok: true, method: 'share', url };
      }

      await copyTextToClipboard(url);
      setShareNotice('Link copied.');
      return { ok: true, method: 'copy', url };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { ok: false, aborted: true };
      }

      if (!copyOnly) {
        try {
          await copyTextToClipboard(url);
          setShareNotice('Link copied.');
          return { ok: true, method: 'copy', url };
        } catch {
          // fall through to generic message
        }
      }

      setShareNotice('Could not share this link on your phone.');
      return { ok: false, error };
    }
  }, [buildShareUrl]);

  const handleSharePage = useCallback(async () => {
    const isProductPage = currentView === 'product_detail' && selectedProduct;
    const result = await handleShareLink({
      title: isProductPage ? `${selectedProduct.name} | Velure Coffee` : 'Velure Coffee',
      text: isProductPage
        ? `${selectedProduct.subtitle} from Velure Coffee`
        : 'Check out Velure Coffee.',
    });

    if (result.ok) {
      trackEvent(result.method === 'share' ? 'share' : 'copy_link', {
        view: currentView,
        url: result.url,
      });
    }
  }, [currentView, handleShareLink, selectedProduct]);

  const handleShareProduct = useCallback(async (product) => {
    const result = await handleShareLink({
      path: getPathForView('product_detail', { productId: product.id }),
      title: `${product.name} | Velure Coffee`,
      text: `${product.subtitle} from Velure Coffee`,
    });

    if (result.ok) {
      trackEvent(result.method === 'share' ? 'share' : 'copy_link', {
        view: 'product_detail',
        item_id: product.id,
        url: result.url,
      });
    }
  }, [handleShareLink]);

  const handleCopyProductLink = useCallback(async (product) => {
    const result = await handleShareLink({
      path: getPathForView('product_detail', { productId: product.id }),
      title: `${product.name} | Velure Coffee`,
      text: `${product.subtitle} from Velure Coffee`,
      copyOnly: true,
    });

    if (result.ok) {
      trackEvent('copy_link', {
        view: 'product_detail',
        item_id: product.id,
        url: result.url,
      });
    }
  }, [handleShareLink]);

  const [authState, setAuthState] = useState(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      return normalizeAuthState(storedAuth ? JSON.parse(storedAuth) : DEFAULT_AUTH_STATE);
    } catch (error) {
      console.error('Failed to load auth state', error);
      return { ...DEFAULT_AUTH_STATE };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: authState.user,
        session: authState.session,
      }));
    } catch (error) {
      console.error('Failed to save auth state', error);
    }
  }, [authState.session, authState.user]);

  useEffect(() => {
    let cancelled = false;

    const hydrateAuthSession = async () => {
      if (!authState.session?.accessToken) {
        return;
      }

      setAuthState((previousState) => ({ ...previousState, isLoading: true }));

      try {
        let currentSession = authState.session;
        let currentUser = authState.user;

        const shouldRefresh = currentSession.expiresAt && currentSession.expiresAt <= Date.now() + 60_000;
        if (shouldRefresh && currentSession.refreshToken) {
          const refreshed = await supabaseRefreshSession(currentSession.refreshToken);
          if (refreshed.session) {
            currentSession = refreshed.session;
            currentUser = refreshed.user || currentUser;
          }
        }

        if (!currentUser?.id) {
          const fetchedUser = await supabaseGetUser(currentSession.accessToken);
          currentUser = fetchedUser ? { id: fetchedUser.id, email: fetchedUser.email || '' } : null;
        }

        if (!cancelled) {
          if (!currentUser?.id) {
            setAuthState({ ...DEFAULT_AUTH_STATE });
            return;
          }

          setAuthState({
            isLoading: false,
            session: currentSession,
            user: {
              id: currentUser.id,
              email: currentUser.email || '',
            },
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to hydrate auth session', error);
          setAuthState({ ...DEFAULT_AUTH_STATE });
        }
      }
    };

    hydrateAuthSession();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accountStorageScope = authState.user?.id || 'guest';
  const cartStorageKey = `velure_cart_${accountStorageScope}`;
  const rewardsStorageKey = `${REWARDS_STORAGE_KEY}_${accountStorageScope}`;

  const [cart, setCart] = useState([]);
  const [rewardsProfile, setRewardsProfile] = useState(() => {
    return { ...DEFAULT_REWARDS_PROFILE };
  });
  const skipNextCartSaveRef = useRef(true);
  const skipNextRewardsSaveRef = useRef(true);
  const skipNextRemoteRewardsSyncRef = useRef(true);
  const [isRemoteRewardsReady, setIsRemoteRewardsReady] = useState(false);

  useEffect(() => {
    skipNextCartSaveRef.current = true;
    try {
      const savedCart = localStorage.getItem(cartStorageKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
    } catch (error) {
      console.error('Failed to load cart', error);
      setCart([]);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    if (skipNextCartSaveRef.current) {
      skipNextCartSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart', error);
    }
  }, [cart, cartStorageKey]);

  useEffect(() => {
    skipNextRewardsSaveRef.current = true;
    try {
      const savedRewards = localStorage.getItem(rewardsStorageKey);
      setRewardsProfile(normalizeRewardsProfile(savedRewards ? JSON.parse(savedRewards) : DEFAULT_REWARDS_PROFILE));
    } catch (error) {
      console.error('Failed to load rewards profile', error);
      setRewardsProfile({ ...DEFAULT_REWARDS_PROFILE });
    }
  }, [rewardsStorageKey]);

  useEffect(() => {
    if (skipNextRewardsSaveRef.current) {
      skipNextRewardsSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(rewardsStorageKey, JSON.stringify(rewardsProfile));
    } catch (error) {
      console.error('Failed to save rewards profile', error);
    }
  }, [rewardsProfile, rewardsStorageKey]);

  useEffect(() => {
    let cancelled = false;
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;

    if (!accessToken || !userId) {
      setIsRemoteRewardsReady(false);
      return undefined;
    }

    const hydrateRemoteRewards = async () => {
      setIsRemoteRewardsReady(false);
      skipNextRemoteRewardsSyncRef.current = true;
      try {
        const payload = await loadRewardsProfileFromApi(accessToken);
        if (cancelled) return;

        const remoteProfile = payload?.profile ? normalizeRewardsProfile(payload.profile) : null;

        if (remoteProfile) {
          skipNextRewardsSaveRef.current = true;
          skipNextRemoteRewardsSyncRef.current = true;
          setRewardsProfile({
            ...remoteProfile,
            email: authState.user?.email || remoteProfile.email,
          });
        } else {
          let localProfile = { ...DEFAULT_REWARDS_PROFILE };
          try {
            const savedLocalProfile = localStorage.getItem(rewardsStorageKey);
            localProfile = normalizeRewardsProfile(savedLocalProfile ? JSON.parse(savedLocalProfile) : DEFAULT_REWARDS_PROFILE);
          } catch (error) {
            console.error('Failed to load local rewards profile for bootstrap', error);
          }

          await syncRewardsProfileToApi(accessToken, {
            ...localProfile,
            email: authState.user?.email || localProfile.email,
          });
        }
      } catch (error) {
        console.error('Failed to load remote rewards profile', error);
      } finally {
        if (!cancelled) {
          setIsRemoteRewardsReady(true);
        }
      }
    };

    hydrateRemoteRewards();

    return () => {
      cancelled = true;
    };
  }, [authState.session?.accessToken, authState.user?.id, authState.user?.email, rewardsStorageKey]);

  useEffect(() => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;

    if (!accessToken || !userId || !isRemoteRewardsReady) {
      return undefined;
    }

    if (skipNextRemoteRewardsSyncRef.current) {
      skipNextRemoteRewardsSyncRef.current = false;
      return undefined;
    }

    const syncTimeout = setTimeout(async () => {
      try {
        await syncRewardsProfileToApi(accessToken, {
          ...rewardsProfile,
          email: authState.user?.email || rewardsProfile.email,
        });
      } catch (error) {
        console.error('Failed to sync remote rewards profile', error);
      }
    }, 450);

    return () => {
      clearTimeout(syncTimeout);
    };
  }, [
    authState.session?.accessToken,
    authState.user?.id,
    authState.user?.email,
    isRemoteRewardsReady,
    rewardsProfile,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const currentPath = window.location.pathname !== '/' ? window.location.pathname.replace(/\/+$/, '') : '/';
    const hasBackGuard = window.history.state?.velureBackGuard;

    if (!hasBackGuard) {
      if (currentPath !== ROUTE_PATHS.home) {
        const initialRoute = getRouteFromPath(currentPath);
        window.history.replaceState({ velureBackGuard: true, view: 'home' }, '', ROUTE_PATHS.home);
        window.history.pushState(
          { velureBackGuard: true, view: initialRoute.view, productId: initialRoute.productId },
          '',
          getPathForView(initialRoute.view, { productId: initialRoute.productId })
        );
      } else {
        window.history.replaceState({ velureBackGuard: true, view: 'home' }, '', ROUTE_PATHS.home);
      }
    }

    const handlePopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = typeof window !== 'undefined'
      ? window.location.pathname
      : getPathForView(currentView, { productId: route.productId });

    trackEvent('page_view', {
      path,
      view: currentView,
      ...(route.productId ? { product_id: route.productId } : {}),
    });
  }, [currentView, route.productId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const path = window.location.pathname;
    const canonical = `${origin}${path}`;
    const defaultImage = `${origin}/vite.svg`;

    const viewMeta = {
      home: {
        title: 'Velure | Luxury Functional & Single-Origin Coffee',
        description: 'Elevate your ritual with Velure. Premium coffee, functional blends, and ceremonial matcha.',
      },
      shop_all: {
        title: 'All Collections | Velure Coffee',
        description: 'Browse all Velure coffee collections, from functional blends to single-origin favorites.',
      },
      shop_functional: {
        title: 'Functional Blends | Velure Coffee',
        description: 'Explore Velure functional coffee blends with purposeful ingredients for daily focus and energy.',
      },
      shop_single_origin: {
        title: 'Single Origin Series | Velure Coffee',
        description: 'Discover Velure single-origin coffee with distinct regional profiles and premium quality.',
      },
      checkout: {
        title: 'Checkout | Velure Coffee',
        description: 'Secure Stripe checkout for your Velure order.',
      },
      rewards: {
        title: 'Rewards App | Velure Coffee',
        description: 'Earn points, unlock discounts, and redeem free-shipping rewards with the Velure rewards flow.',
      },
      subscription: {
        title: 'Subscription | Velure Coffee',
        description: 'Subscribe to Velure for recurring coffee deliveries and members-only perks.',
      },
      wholesale: {
        title: 'Wholesale & Bulk | Velure Coffee',
        description: 'Bulk and wholesale coffee options for restaurants, cafes, hotels, and business partners.',
      },
      contact: {
        title: 'Contact | Velure Coffee',
        description: 'Contact Velure for support, wholesale inquiries, and product questions.',
      },
      account: {
        title: 'Account | Velure Coffee',
        description: 'Sign in or create a Velure account to manage rewards and activity.',
      },
      privacy: {
        title: 'Privacy Policy | Velure Coffee',
        description: 'Read how Velure collects, uses, and protects personal information.',
      },
      terms: {
        title: 'Terms of Service | Velure Coffee',
        description: 'Review Velure website and purchase terms, disclaimers, and user obligations.',
      },
      shipping_returns: {
        title: 'Shipping & Returns | Velure Coffee',
        description: 'Shipping coverage, package-weight rates, delivery estimates, and return/refund rules.',
      },
      rewards_terms: {
        title: 'Rewards Terms | Velure Coffee',
        description: 'Program rules for earning and redeeming Velure rewards points and perks.',
      },
      subscription_terms: {
        title: 'Subscription Terms | Velure Coffee',
        description: 'Recurring billing, cancellation, and subscription offer terms for Velure.',
      },
    };

    const activeMeta = viewMeta[currentView] || viewMeta.home;
    let title = activeMeta.title;
    let description = activeMeta.description;
    let image = defaultImage;
    let structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Velure Coffee',
      url: `${origin}/`,
    };

    if (currentView === 'product_detail' && selectedProduct) {
      title = `${selectedProduct.name} | Velure Coffee`;
      description = selectedProduct.description.split('\n')[0] || activeMeta.description;
      image = selectedProduct.images[0] || defaultImage;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: selectedProduct.name,
        description,
        image: selectedProduct.images,
        brand: {
          '@type': 'Brand',
          name: 'Velure',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: selectedProduct.price.toFixed(2),
          availability: 'https://schema.org/InStock',
          url: canonical,
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(selectedProduct.rating),
          reviewCount: String(selectedProduct.reviews),
        },
      };
    }

    document.title = title;
    upsertMetaByName('description', description);
    upsertMetaByProperty('og:title', title);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:url', canonical);
    upsertMetaByProperty('og:image', image);
    upsertMetaByProperty('twitter:title', title);
    upsertMetaByProperty('twitter:description', description);
    upsertMetaByProperty('twitter:image', image);
    upsertCanonical(canonical);
    upsertStructuredData(structuredData);
  }, [currentView, selectedProduct]);

  const addToCart = (product) => {
    setCart((previousCart) => [...previousCart, product]);
    openCart();
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: Number(product.price.toFixed(2)),
      item_id: product.id,
      item_name: product.name,
    });
  };

  const removeFromCart = (index) => {
    setCart((previousCart) => {
      const newCart = [...previousCart];
      const [removedItem] = newCart.splice(index, 1);

      if (removedItem) {
        trackEvent('remove_from_cart', {
          currency: 'USD',
          value: Number(removedItem.price.toFixed(2)),
          item_id: removedItem.id,
          item_name: removedItem.name,
        });
      }

      return newCart;
    });
  };

  const proceedToCheckout = useCallback(() => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const pricing = getCheckoutPricing(subtotal, rewardsProfile.activeRewardId);

    trackEvent('begin_checkout', {
      currency: 'USD',
      value: Number(pricing.total.toFixed(2)),
      item_count: cart.length,
      reward_id: rewardsProfile.activeRewardId || undefined,
    });

    closeCart();
    if (typeof window !== 'undefined') {
      window.location.assign('/checkout.html');
      return;
    }
    navigateToView('checkout');
  }, [cart, closeCart, navigateToView, rewardsProfile.activeRewardId]);

  const openProductDetail = (product) => {
    navigateToView('product_detail', { productId: product.id });
    trackEvent('view_item', {
      currency: 'USD',
      value: Number(product.price.toFixed(2)),
      item_id: product.id,
      item_name: product.name,
    });
  };

  const handleSignIn = useCallback(async (email, password) => {
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      const normalizedEmail = normalizeLower(email);
      const signInResult = await supabaseSignIn(normalizedEmail, password);
      if (!signInResult.session?.accessToken) {
        throw new Error('Unable to start a session. Please check your credentials.');
      }

      let resolvedUser = signInResult.user;
      if (!resolvedUser?.id) {
        resolvedUser = await supabaseGetUser(signInResult.session.accessToken);
      }

      if (!resolvedUser?.id) {
        throw new Error('Unable to load account details.');
      }

      setAuthState({
        isLoading: false,
        session: signInResult.session,
        user: {
          id: resolvedUser.id,
          email: resolvedUser.email || normalizedEmail,
        },
      });

      trackEvent('login', { method: 'password' });
      return { ok: true, message: 'Signed in successfully.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      return { ok: false, message };
    }
  }, []);

  const handleSignUp = useCallback(async (email, password) => {
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      const normalizedEmail = normalizeLower(email);
      const signUpResult = await supabaseSignUp(normalizedEmail, password);

      if (signUpResult.session?.accessToken) {
        const resolvedUser = signUpResult.user || await supabaseGetUser(signUpResult.session.accessToken);
        if (!resolvedUser?.id) {
          throw new Error('Account created, but user profile could not be loaded.');
        }

        setAuthState({
          isLoading: false,
          session: signUpResult.session,
          user: {
            id: resolvedUser.id,
            email: resolvedUser.email || normalizedEmail,
          },
        });

        trackEvent('sign_up', { method: 'password' });
        return { ok: true, message: 'Account created and signed in.' };
      }

      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      trackEvent('sign_up', { method: 'password', verification_required: true });
      return {
        ok: true,
        message: 'Account created. Check your email to confirm, then sign in.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account right now.';
      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      return { ok: false, message };
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    const accessToken = authState.session?.accessToken;
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      if (accessToken) {
        await supabaseSignOut(accessToken);
      }
    } catch (error) {
      console.error('Sign-out request failed', error);
    } finally {
      setAuthState({ ...DEFAULT_AUTH_STATE });
      trackEvent('logout');
      navigateToView('home', { replace: true });
    }
  }, [authState.session?.accessToken, navigateToView]);

  const joinRewards = useCallback((email) => {
    if (!authState.user?.id) {
      return { ok: false, message: 'Sign in to activate rewards on your account.' };
    }

    const normalizedEmail = normalizeLower(email);
    let result = { ok: true, message: 'Rewards account updated.' };

    setRewardsProfile((previousProfile) => {
      const alreadyEnrolled = previousProfile.enrolled;
      const bonusPoints = alreadyEnrolled ? 0 : REWARDS_SIGNUP_BONUS;
      let nextProfile = {
        ...previousProfile,
        enrolled: true,
        email: normalizedEmail || previousProfile.email,
        points: previousProfile.points + bonusPoints,
        lifetimePoints: previousProfile.lifetimePoints + bonusPoints,
      };

      if (!alreadyEnrolled) {
        nextProfile = appendRewardsHistory(nextProfile, {
          type: 'join_bonus',
          description: `Joined rewards and received ${REWARDS_SIGNUP_BONUS} bonus points`,
          pointsDelta: REWARDS_SIGNUP_BONUS,
        });
        result = { ok: true, message: `Rewards activated. ${REWARDS_SIGNUP_BONUS} points added.` };
      } else {
        result = { ok: true, message: 'Rewards account updated.' };
      }

      return nextProfile;
    });

    trackEvent('rewards_join', { email: normalizedEmail || undefined });
    return result;
  }, [authState.user?.id]);

  const redeemReward = useCallback((rewardId) => {
    const rewardOffer = getRewardOffer(rewardId);
    if (!rewardOffer) {
      return { ok: false, message: 'Invalid reward selection.' };
    }

    let result = { ok: false, message: 'Unable to redeem reward right now.' };

    setRewardsProfile((previousProfile) => {
      if (!previousProfile.enrolled) {
        result = { ok: false, message: 'Join rewards first to redeem points.' };
        return previousProfile;
      }

      if (previousProfile.activeRewardId) {
        result = { ok: false, message: 'You already have an active reward in cart.' };
        return previousProfile;
      }

      if (previousProfile.points < rewardOffer.pointsCost) {
        result = { ok: false, message: `You need ${rewardOffer.pointsCost - previousProfile.points} more points.` };
        return previousProfile;
      }

      const nextProfile = appendRewardsHistory(
        {
          ...previousProfile,
          points: previousProfile.points - rewardOffer.pointsCost,
          activeRewardId: rewardOffer.id,
        },
        {
          type: 'redeem',
          description: `Redeemed ${rewardOffer.name}`,
          pointsDelta: -rewardOffer.pointsCost,
        },
      );

      result = { ok: true, message: `${rewardOffer.name} applied to cart.` };
      return nextProfile;
    });

    if (result.ok) {
      trackEvent('rewards_redeem', {
        reward_id: rewardOffer.id,
        points_cost: rewardOffer.pointsCost,
      });
    }

    return result;
  }, []);

  const removeReward = useCallback(() => {
    let result = { ok: false, message: 'No active reward to remove.' };

    setRewardsProfile((previousProfile) => {
      const activeReward = getRewardOffer(previousProfile.activeRewardId);
      if (!activeReward) {
        result = { ok: false, message: 'No active reward to remove.' };
        return previousProfile;
      }

      const nextProfile = appendRewardsHistory(
        {
          ...previousProfile,
          points: previousProfile.points + activeReward.pointsCost,
          activeRewardId: null,
        },
        {
          type: 'reward_removed',
          description: `Removed ${activeReward.name} and restored points`,
          pointsDelta: activeReward.pointsCost,
        },
      );

      result = { ok: true, message: 'Reward removed and points restored.' };
      return nextProfile;
    });

    if (result.ok) {
      trackEvent('rewards_removed');
    }

    return result;
  }, []);

  const handleCheckoutSuccess = useCallback((checkoutPayload) => {
    const earnedPoints = Math.max(0, Math.floor(Number(checkoutPayload?.earnablePoints || 0)));
    const usedRewardId = checkoutPayload?.reward?.id || null;

    setRewardsProfile((previousProfile) => {
      let nextProfile = {
        ...previousProfile,
        activeRewardId: usedRewardId ? null : previousProfile.activeRewardId,
      };

      if (earnedPoints > 0) {
        nextProfile = appendRewardsHistory(
          {
            ...nextProfile,
            points: nextProfile.points + earnedPoints,
            lifetimePoints: nextProfile.lifetimePoints + earnedPoints,
          },
          {
            type: 'earned_checkout',
            description: `Earned ${earnedPoints} points from checkout`,
            pointsDelta: earnedPoints,
          },
        );
      }

      return nextProfile;
    });

    setCart([]);

    trackEvent('rewards_checkout_processed', {
      earned_points: earnedPoints,
      reward_id: usedRewardId || undefined,
      total: checkoutPayload?.total,
    });
  }, []);

  // --- CONTENT MAPPING ---
  
  const renderView = () => {
    if (currentView === 'product_detail' && selectedProduct) {
      return (
        <ProductDetailView 
          product={selectedProduct} 
          addToCart={addToCart} 
          onBack={() => setView('shop_all')}
          isCartOpen={isCartOpen}
          onShareProduct={handleShareProduct}
          onCopyProductLink={handleCopyProductLink}
        />
      );
    }

    switch (currentView) {
      case 'home': return <HomeView openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_all': return <ShopView category="all" openProductDetail={openProductDetail} />;
      case 'shop_functional': return <ShopView category="functional" openProductDetail={openProductDetail} />;
      case 'shop_single_origin': return <ShopView category="single_origin" openProductDetail={openProductDetail} />;
      case 'checkout': return (
        <CheckoutView
          cart={cart}
          rewardsProfile={rewardsProfile}
          authUser={authState.user}
          setView={setView}
          onOpenCart={openCart}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      );
      case 'contact': return <ContactView />;
      case 'account': return (
        <AccountView
          authState={authState}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSignOut={handleSignOut}
          setView={setView}
        />
      );
      case 'rewards': return (
        <RewardsView
          setView={setView}
          rewardsProfile={rewardsProfile}
          onJoinRewards={joinRewards}
          onRedeemReward={redeemReward}
          onRemoveReward={removeReward}
          authUser={authState.user}
        />
      );
      case 'subscription': return <SubscriptionView setView={setView} />;
      case 'product_detail': return <ShopView category="all" openProductDetail={openProductDetail} />;
      
      case 'about': return (
        <TextView title="Our Story" content={`In a world that rushes, Velure exists to make you pause. We believe your morning cup is not just caffeine, it is the ritual that sets the tone for your day.\n\nJoe Hart has wanted to build his own coffee brand for a long time. He built Velure around one standard: source from ethical, clean farms and keep every blend transparent.\n\nOur beans are selected for quality and traceability, with no genetically engineered or modified ingredients listed in our formulas. We focus on real coffee beans, thoughtful functional additions, and no unnecessary fillers.\n\nFrom the altitude of the Brazilian highlands to the precision of our functional mushroom blends, every decision we make is guided by uncompromising quality.\n\n"Velure is my invitation to you: Slow down, taste the difference, and start your day with excellence." — Joe Hart, Founder`} />
      );

      case 'sourcing': return (
        <TextView title="Sourcing & Sustainability" content={`We partner directly with small-lot farmers who prioritize soil health and biodiversity. \n\nOur beans are shade-grown at high altitudes, ensuring a denser bean and a more complex flavor profile. We pay 20% above Fair Trade prices to ensure our partners can thrive.`} />
      );

      case 'wholesale': return (
        <WholesaleView setView={setView} />
      );

      case 'privacy': return (
        <TextView title="Privacy Policy" content={LEGAL_CONTENT.privacy} />
      );

      case 'terms': return (
        <TextView title="Terms of Service" content={LEGAL_CONTENT.terms} />
      );

      case 'shipping_returns': return (
        <TextView title="Shipping & Returns Policy" content={LEGAL_CONTENT.shippingReturns} />
      );

      case 'rewards_terms': return (
        <TextView title="Rewards Terms" content={LEGAL_CONTENT.rewardsTerms} />
      );

      case 'subscription_terms': return (
        <TextView title="Subscription Terms" content={LEGAL_CONTENT.subscriptionTerms} />
      );

      default: return <HomeView openProductDetail={openProductDetail} setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0C] text-[#F9F6F0] font-sans selection:bg-[#D4AF37] selection:text-[#0B0C0C]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Montserrat', sans-serif; }
      `}</style>

      <Navigation
        currentView={currentView}
        cartCount={cart.length}
        setView={setView}
        toggleCart={openCart}
        authUser={authState.user}
        onSignOut={handleSignOut}
        onSharePage={handleSharePage}
      />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        closeCart={closeCart} 
        cart={cart} 
        removeFromCart={removeFromCart}
        rewardsProfile={rewardsProfile}
        onRedeemReward={redeemReward}
        onRemoveReward={removeReward}
        onProceedToCheckout={proceedToCheckout}
      />

      {renderView()}

      <Footer setView={setView} />

      {shareNotice && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-[#151515] border border-[#D4AF37] text-[#F9F6F0] px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xl"
          role="status"
          aria-live="polite"
        >
          {shareNotice}
        </div>
      )}
    </div>
  );
};

export default App;
