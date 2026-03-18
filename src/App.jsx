import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ShoppingBag, Menu, X, ChevronDown, Coffee, Leaf, Award, Check, Mail, MapPin, Phone, ArrowLeft, User, Share2, Link2, Star, Gift } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AdminApp from './admin/AdminApp';
import { SHIPPING_ZONES, SUPPORTED_COUNTRY_CODES } from '../shared/shipping.js';

// --- BRAND ASSETS & DATA ---
const DEFAULT_SHARE_IMAGE_URL = 'https://res.cloudinary.com/dfygdydcj/image/upload/v1767217072/6843a1f1-d7bc-41c5-97b3-990b7dd18a18.png';
const HOME_HERO_IMAGE_URL = 'https://res.cloudinary.com/dfygdydcj/image/upload/v1772420231/velure_homepage_pbzzhb.png';

const PRODUCTS = [
  {
    id: "fuse",
    name: "FUSE",
    subtitle: "Mushroom Fuse Instant Coffee",
    price: 38.00,
    category: "functional",
    tag: "Best Seller",
    subscriptionEligible: true,
    featuredHome: true,
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
    category: "functional",
    tag: "Ceremonial Grade",
    subscriptionEligible: true,
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
    category: "single_origin",
    tag: "Dark Roast",
    subscriptionEligible: true,
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
    category: "functional",
    tag: "Adaptogenic",
    subscriptionEligible: true,
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
    category: "functional",
    tag: "Superfood",
    subscriptionEligible: true,
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
    category: "single_origin",
    tag: "Single Origin",
    subscriptionEligible: true,
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
  },
  {
    id: "bloom-pods",
    name: "BLOOM",
    subtitle: "Fruity Bloom Coffee Pods",
    price: 18.00,
    category: "signature",
    tag: "Light Roast Pods",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321699/1771424462505-generated-label-image-0_ehrjie.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321704/1771424462521-generated-label-image-3_odhmjk.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321708/1771424462512-generated-label-image-2_iyujiw.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321713/1771424462506-generated-label-image-5_yirmjl.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321717/1771424462527-generated-label-image-1_hrbtfn.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321720/1771424462502-generated-label-image-4_fej8c3.jpg"
    ],
    description: `Bright, fruit-forward light roast pods designed for an effortless morning ritual.

Notes: Citrus zest • dried fruit • floral lift
Best For: Bright mornings • larger cup settings • iced over ice
Pairing: Pairs beautifully with citrus pastry, yogurt, or a simple buttered toast.

A bright, fruit-forward light roast in a single-serve format—clean, lively, and effortless. BLOOM opens with citrus clarity and soft dried-fruit sweetness, finishing light and crisp for an elevated daily cup. Crafted from a blend of Ethiopia, Mexico, and Brazil, in 12 Keurig-compatible pods.`,
    details: {
      origin: "Ethiopia, Mexico, Brazil",
      roast: "Light",
      ingredients: "100% Arabica",
      weight: "12 pods / 4.7oz / 139g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica",
      varietals: "Ethiopian Heirloom Varietals, Bourbon, Typica, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Ethiopia, Mexico, Brazil",
      productAmount: "12 pods / 4.7oz / 139g",
      grossWeight: "7.5oz / 212g",
      suggestedUse: "Brew using a Keurig-compatible machine. Choose 8-10 oz. Adjust to taste."
    }
  },
  {
    id: "hazel-pods",
    name: "HAZEL",
    subtitle: "Rich Hazelnut Coffee Pods",
    price: 18.00,
    category: "signature",
    tag: "Medium Roast Pods",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321615/1771446944274-generated-label-image-0_nzoauh.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321628/1771446944253-generated-label-image-3_mlmmpc.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321633/1771446944256-generated-label-image-1_pxyvgb.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321636/1771446944279-generated-label-image-2_kd1lbb.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321625/1771446944262-generated-label-image-4_oucmz5.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321639/1771446944268-generated-label-image-5_mumnkl.jpg"
    ],
    description: `Cozy medium roast pods with a warm, rounded cup and a smooth finish.

Notes: Roasted hazelnut • gentle sweetness • smooth finish
Best For: Cozy cups • smooth daily brews • medium cup settings
Pairing: Pairs with almond biscotti, oat milk, or a warm cinnamon pastry.

A cozy medium roast designed for ease without sacrificing finish. HAZEL leans warm and rounded—nutty, softly sweet, and smooth—built for mornings that want comfort and consistency. Sourced as a balanced blend from Brazil and Mexico, packed as 12 Keurig-compatible pods for a polished, repeatable ritual.`,
    details: {
      origin: "Brazil, Mexico",
      roast: "Medium",
      ingredients: "100% Arabica",
      weight: "12 pods / 4.7oz / 139g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica",
      varietals: "Bourbon, Typica, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Mexico",
      productAmount: "12 pods / 4.7oz / 139g",
      grossWeight: "7.5oz / 212g",
      suggestedUse: "Brew using a Keurig-compatible machine. Choose 8-10 oz. Adjust to taste."
    }
  },
  {
    id: "molten",
    name: "MOLTEN",
    subtitle: "Molten Caramel Coffee Pods",
    price: 19.00,
    category: "signature",
    tag: "Dark Roast Pods",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321748/1771115507142-generated-label-image-0_besrqh.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321753/1771115507143-generated-label-image-2_oelebd.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321760/1771115507148-generated-label-image-1_cgiq5i.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321756/1771115507148-generated-label-image-5_ntsrqx.jpg"
    ],
    description: `Dark roast pods with caramelized depth and a bold, composed finish.

Notes: Baker’s chocolate • dark toffee • full body
Best For: Bold mornings • smaller cup settings • latte-style cups
Pairing: Pairs with dark chocolate, a salted caramel bite, or steamed milk.

Dark roast pods with a deep, caramelized profile and a bold, satisfying finish. MOLTEN brings roasted intensity with a smooth, toffee-leaning sweetness that reads rich rather than sugary. Built from coffees sourced across Brazil, Mexico, and Guatemala, in 12 Keurig-compatible pods made for a fast, elevated cup.`,
    details: {
      origin: "Brazil, Mexico, Guatemala",
      roast: "Dark",
      ingredients: "100% Arabica",
      weight: "12 pods / 4.7oz / 139g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica",
      varietals: "Bourbon, Typica, Caturra, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Mexico, Guatemala",
      productAmount: "12 pods / 4.7oz / 139g",
      grossWeight: "7.5oz / 212g",
      suggestedUse: "Brew using a Keurig-compatible machine. Choose 8-10 oz. Adjust to taste."
    }
  },
  {
    id: "drift",
    name: "DRIFT",
    subtitle: "Citrus Drift Coffee Beans",
    price: 27.00,
    category: "signature",
    tag: "Signature Blend",
    subscriptionEligible: false,
    featuredHome: true,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320857/1772237170011-generated-label-image-0_zzj3ml.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320862/1772237170028-generated-label-image-3_dmduxl.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320865/1772237170023-generated-label-image-2_ejtd5p.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320874/1772237170011-generated-label-image-1_xl0kml.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320877/1772237170017-generated-label-image-4_pwdf7c.jpg"
    ],
    description: `Balanced medium roast whole beans with cocoa depth and a clean citrus edge.

Notes: Toffee sweetness • dark chocolate • citrus lift
Best For: Pour-over • drip • cold brew
Pairing: Pairs with orange zest pastries, dark chocolate, or a light honey drizzle.

A medium roast with lift—balanced sweetness, cocoa depth, and a clean citrus edge that keeps the cup bright. DRIFT is designed to feel refined across brew methods: smooth in drip, vivid in pour-over, and composed over ice. A multi-origin blend from Brazil, Colombia, Guatemala, and Ethiopia, delivered as 12 oz whole beans.`,
    details: {
      origin: "Brazil, Colombia, Guatemala, Ethiopia",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Ethiopian Heirloom Varietals, Caturra, Colombia, Castillo, Typica, Bourbon, Catuaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Colombia, Guatemala, Ethiopia",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, pour-over, French press, or cold brew."
    }
  },
  {
    id: "nougat",
    name: "NOUGAT",
    subtitle: "Praline Smooth Coffee Beans",
    price: 27.00,
    category: "signature",
    tag: "Signature Blend",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320991/1772236038526-generated-label-image-0_mnguht.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320996/1772236038523-generated-label-image-3_vgd8ld.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321000/1772236038532-generated-label-image-1_abumsi.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321004/1772236038526-generated-label-image-2_uqqil2.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321007/1772236038522-generated-label-image-4_bcbg2j.jpg"
    ],
    description: `Smooth medium roast whole beans with quiet sweetness and everyday elegance.

Notes: Nutty praline • light toffee • balanced finish
Best For: Drip • French press • everyday brewing
Pairing: Pairs with toasted nuts, shortbread, or a soft splash of oat milk.

A smooth, medium roast built around quiet sweetness—nutty praline character with a gentle toffee finish. NOUGAT is the kind of coffee that stays elegant even as it gets stronger: balanced, warm, and easy to return to. Crafted from Brazil, Colombia, and Guatemala, as 12 oz whole beans for daily brewing.`,
    details: {
      origin: "Brazil, Colombia, Guatemala",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Caturra, Colombia, Castillo, Typica, Bourbon, Catuaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Colombia, Guatemala",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, pour-over, or French press."
    }
  },
  {
    id: "praline",
    name: "PRALINE",
    subtitle: "Rich Hazelnut Coffee Beans",
    price: 27.00,
    category: "signature",
    tag: "Hazelnut Notes",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321468/1772217325971-generated-label-image-0_dklujb.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321472/1772217325970-generated-label-image-1_ke1r4f.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321476/1772217325974-generated-label-image-2_d4zagh.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321479/1772217325967-generated-label-image-3_ehqofo.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321483/1772217325976-generated-label-image-4_zvarrv.jpg"
    ],
    description: `Medium roast whole beans with a warm, hazelnut-leaning profile and soft richness.

Notes: Roasted nut • gentle sweetness • smooth cup
Best For: Drip • French press • moka pot
Pairing: Pairs with biscotti, cocoa granola, or a lightly sweetened latte.

Medium roast whole beans with a warm, hazelnut-leaning profile—rounded, subtly sweet, and clean through the finish. PRALINE is comfort-forward but not heavy, with an easy richness that suits drip, press, or moka. Sourced from Brazil and Mexico, as 12 oz whole beans.`,
    details: {
      origin: "Brazil, Mexico",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Typica, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Mexico",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or moka."
    }
  },
  {
    id: "citra",
    name: "CITRA",
    subtitle: "Fruity Bloom Coffee Beans",
    price: 27.00,
    category: "signature",
    tag: "Light Roast",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321505/1772216717247-generated-label-image-0_fcluhh.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321510/1772216717251-generated-label-image-1_leiowy.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321514/1772216717240-generated-label-image-2_c0tyyh.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321517/1772216717235-generated-label-image-3_cz1yhv.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321521/1772216717237-generated-label-image-4_cnsg8o.jpg"
    ],
    description: `Light roast whole beans that pour bright and clean, built for clarity.

Notes: Citrus zest • dried fruit • crisp finish
Best For: Pour-over • iced coffee • light, clean cups
Pairing: Pairs with fresh fruit, lemon loaf, or a crisp, iced pour-over.

A light roast designed for brightness with structure—citrus clarity, dried fruit sweetness, and a crisp finish that stays clean. CITRA shines in pour-over and iced preparations, where its lively character reads the most. Crafted from Ethiopia, Mexico, and Brazil, as 12 oz whole beans.`,
    details: {
      origin: "Ethiopia, Mexico, Brazil",
      roast: "Light",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Ethiopian Heirloom Varietals, Bourbon, Typica, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Ethiopia, Mexico, Brazil",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Best for pour-over, drip, or iced coffee."
    }
  },
  {
    id: "zest",
    name: "ZEST",
    subtitle: "Lemon Glaze Coffee Beans",
    price: 27.00,
    category: "signature",
    tag: "Citrus Notes",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320941/1772236528415-generated-label-image-0_mdkpbo.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320949/1772236528422-generated-label-image-2_dqqcoa.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320953/1772236528429-generated-label-image-1_pnhcct.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320962/1772236528413-generated-label-image-3_t1dqar.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320958/1772236528418-generated-label-image-4_piqoww.jpg"
    ],
    description: `Light roast whole beans with citrus clarity and a tea-like finish.

Notes: Bright citrus • soft caramel • clean finish
Best For: Pour-over • drip • iced coffee
Pairing: Pairs with vanilla yogurt, citrus glaze pastry, or a clean iced cup.

A light roast with a crisp, citrus-forward profile and a softly sweet backbone. ZEST finishes tea-like and clean, with just enough caramel warmth to keep it balanced—not sharp. Built from Ethiopia, Guatemala, and Brazil, as 12 oz whole beans for a bright, refined ritual.`,
    details: {
      origin: "Ethiopia, Guatemala, Brazil",
      roast: "Light",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Ethiopian Heirloom Varietals, Bourbon, Typica, Caturra, Catuaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Ethiopia, Guatemala, Brazil",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Best for pour-over or iced coffee."
    }
  },
  {
    id: "ember",
    name: "EMBER",
    subtitle: "Deep Roast Coffee Beans",
    price: 28.00,
    category: "signature",
    tag: "Dark Roast",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321542/1772215448439-generated-label-image-0_v2pyrs.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321546/1772215448435-generated-label-image-1_dobvpj.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321550/1772215448444-generated-label-image-2_eqtxjr.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321553/1772215448441-generated-label-image-3_mvahmv.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321557/1772215448442-generated-label-image-4_wnk7nt.jpg"
    ],
    description: `Dark roast whole beans with toasted warmth and a smooth, bold finish.

Notes: Toasted nut • rich cocoa • deep roast
Best For: Strong drip • French press • moka pot
Pairing: Pairs with dark chocolate, toasted nuts, or a classic breakfast sandwich.

A deep dark roast for those who like their cup bold, composed, and full-bodied. EMBER brings toasted-nut warmth and rich cocoa depth with a clean finish that doesn’t feel harsh. Sourced from Brazil and Mexico, as 12 oz whole beans built for drip, press, or moka.`,
    details: {
      origin: "Brazil, Mexico",
      roast: "Dark",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Typica, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Mexico",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or moka pot."
    }
  },
  {
    id: "forge",
    name: "FORGE",
    subtitle: "Molten Caramel Coffee Beans",
    price: 28.00,
    category: "signature",
    tag: "Dark Roast",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321392/1772234477868-generated-label-image-0_imdqxl.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321399/1772234477865-generated-label-image-1_eisgyp.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321404/1772234477872-generated-label-image-3_qaehbj.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321412/1772234477877-generated-label-image-2_php4fj.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321417/1772234477870-generated-label-image-4_eea9nb.jpg"
    ],
    description: `Dark roast whole beans with molten chocolate-toffee depth, built for strong brews.

Notes: Baker’s chocolate • dark toffee • structured finish
Best For: Espresso-style brews • French press • bold drip
Pairing: Pairs with a caramel dessert, steamed milk, or a rich chocolate pastry.

Dark roast whole beans with a molten profile—baker’s chocolate depth, dark toffee sweetness, and a powerful, structured finish. FORGE is bold without feeling burnt, designed to hold up in espresso, press, or a strong drip. Crafted from Brazil, Mexico, and Guatemala, as 12 oz whole beans.`,
    details: {
      origin: "Brazil, Mexico, Guatemala",
      roast: "Dark",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Typica, Caturra, Catuaí, Catucaí, Mundo Novo",
      manufacturerCountry: "USA",
      region: "Brazil, Mexico, Guatemala",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or espresso."
    }
  },
  {
    id: "forest",
    name: "FOREST",
    subtitle: "Forest Decaf Coffee Beans",
    price: 29.00,
    category: "single_origin",
    tag: "Decaf",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321662/1771439409079-generated-label-image-0_lavvns.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321668/1771439409074-generated-label-image-1_jkrfbo.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321671/1771439409083-generated-label-image-2_tfw5mv.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321676/1771439409088-generated-label-image-3_p6iy9a.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321678/1771439409074-generated-label-image-4_kpy7us.jpg"
    ],
    description: `Medium roast decaf whole beans with full flavor and a calm, evening-ready cup.

Notes: Dark chocolate • earthy depth • smooth finish
Best For: Evening cups • drip • French press
Pairing: Pairs with evening dessert, shortbread, or a quiet post-dinner cup.

A medium roast decaf that keeps the ritual intact—dark chocolate depth, earthy warmth, and a smooth, low-bitterness finish. FOREST is built for evenings, slower mornings, and anyone who wants a full cup without the rush. Single-origin character from Sulawesi, Indonesia, as 12 oz whole beans.`,
    details: {
      origin: "Indonesia, Sulawesi",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Java Toraja",
      manufacturerCountry: "USA",
      region: "Indonesia, Sulawesi",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or pour-over."
    }
  },
  {
    id: "grove",
    name: "GROVE",
    subtitle: "Maple Grove Coffee Beans",
    price: 29.00,
    category: "single_origin",
    tag: "Single Origin",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321341/1772234662485-generated-label-image-0_qmlg0i.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321347/1772234662491-generated-label-image-3_sq8m3g.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321357/1772234662482-generated-label-image-2_onye9d.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321363/1772234662477-generated-label-image-1_hgjklq.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321373/1772234662468-generated-label-image-4_dwkaui.jpg"
    ],
    description: `Single-origin medium roast whole beans with classic structure and gentle sweetness.

Notes: Dark chocolate • roasted nut • maple-like finish
Best For: Drip • pour-over • classic medium roast cups
Pairing: Pairs with pancakes, maple-toned pastries, or a classic milk-and-coffee balance.

A composed medium roast with classic structure—dark chocolate character, roasted-nut warmth, and a gentle, maple-like finish that reads naturally sweet. GROVE is single-origin in feel and steady across brew styles, designed for repeatable everyday cups. Sourced from Chiapas, Mexico, as 12 oz whole beans.`,
    details: {
      origin: "Mexico, Chiapas, La Concordia",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Typica",
      manufacturerCountry: "USA",
      region: "Mexico, Chiapas, La Concordia",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or pour-over."
    }
  },
  {
    id: "sable",
    name: "SABLE",
    subtitle: "Velvet Cocoa Coffee Beans",
    price: 30.00,
    category: "single_origin",
    tag: "Single Origin",
    subscriptionEligible: false,
    featuredHome: true,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321172/1772235308237-generated-label-image-0_w4atkr.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321176/1772235308240-generated-label-image-2_chiesw.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321180/1772235308237-generated-label-image-1_gpxhbr.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321321/1772235308240-generated-label-image-3_voqywu.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321332/1772235308243-generated-label-image-4_wzutvv.jpg"
    ],
    description: `Single-origin Colombian medium roast whole beans with velvet cocoa richness and balance.

Notes: Cocoa • cane sugar • soft fruit brightness
Best For: Pour-over • drip • clean chocolate notes
Pairing: Pairs with dark chocolate, flaky croissant, or a smooth cappuccino-style cup.

A velvet-smooth medium roast with cocoa richness and a soft sweetness that lingers. SABLE balances chocolate depth with a light touch of fruit brightness—refined, clean, and quietly complex. Single-origin from Colombia (Huila & Cauca), as 12 oz whole beans.`,
    details: {
      origin: "Colombia, Huila/Cauca",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Caturra, Colombia, Castillo, Typica, Bourbon",
      manufacturerCountry: "USA",
      region: "Colombia, Huila/Cauca",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via drip, French press, or pour-over."
    }
  },
  {
    id: "cerise",
    name: "CERISE",
    subtitle: "Cherry Zest Coffee Beans",
    price: 30.00,
    category: "single_origin",
    tag: "Single Origin",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320709/1772237512483-generated-label-image-0_jvjx2p.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320739/1772237512475-generated-label-image-2_qnzj3z.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320774/1772237512480-generated-label-image-3_cyxhyc.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320783/1772237512490-generated-label-image-1_jxcp8i.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772320808/1772237512476-generated-label-image-4_md80af.jpg"
    ],
    description: `Single-origin medium roast whole beans with bright clarity and a refined cherry finish.

Notes: Citrus brightness • cocoa depth • black-cherry finish
Best For: Pour-over • filter brewing • bright, refined cups
Pairing: Pairs with berry pastry, dark chocolate, or a clean filter brew.

A lively medium roast with a bright opening and a deep, elegant finish. CERISE pairs citrus clarity and cocoa depth with a black-cherry note that reads crisp—not candy-sweet. Single-origin from Guatemala (Huehuetenango / Antigua), as 12 oz whole beans.`,
    details: {
      origin: "Guatemala, Huehuetenango/Antigua",
      roast: "Medium",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Typica, Caturra",
      manufacturerCountry: "USA",
      region: "Guatemala, Huehuetenango/Antigua",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via filter, pour-over, or French press."
    }
  },
  {
    id: "cacao",
    name: "CACAO",
    subtitle: "Chocolate Bold Coffee Beans",
    price: 29.00,
    category: "single_origin",
    tag: "Single Origin",
    subscriptionEligible: false,
    images: [
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321577/1771450675913-generated-label-image-0_aezqge.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321581/1771450675929-generated-label-image-2_x7xgci.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321584/1771450675919-generated-label-image-3_hkdasy.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321587/1771450675912-generated-label-image-1_qnor2n.jpg",
      "https://res.cloudinary.com/dfygdydcj/image/upload/v1772321591/1771450675925-generated-label-image-4_g1olhy.jpg"
    ],
    description: `Dark roast whole beans with deep cocoa intensity and a smooth, bold cup.

Notes: Deep cocoa • toasted nut • bittersweet finish
Best For: Espresso • moka pot • bold drip
Pairing: Pairs with biscotti, a rich chocolate bite, or a bold espresso-style shot.

A bold dark roast built around deep cocoa and toasted depth—full-bodied, smooth, and made for strong brews. CACAO is the cup you reach for when you want intensity with composure, whether it’s espresso, moka, or a rich drip. Crafted from Brazil, as 12 oz whole beans.`,
    details: {
      origin: "Brazil",
      roast: "Dark",
      ingredients: "100% Arabica whole beans",
      weight: "12 oz / 340g"
    },
    nutritionSpecs: {
      ingredients: "100% Arabica whole beans",
      varietals: "Bourbon, Mundo Novo, Catuaí, Catucaí, Catigua",
      manufacturerCountry: "USA",
      region: "Brazil",
      productAmount: "12 oz / 340g",
      grossWeight: "13.5 oz / 383 g",
      suggestedUse: "Grind fresh. Brew via espresso, moka pot, or bold drip."
    }
  },
  {
    id: "bundle-ritual-set",
    name: "RITUAL SET",
    subtitle: "Two-Bag Bundle",
    price: 48.00,
    category: "bundles",
    tag: "Bundle",
    subscriptionEligible: false,
    images: ["https://res.cloudinary.com/dfygdydcj/image/upload/v1772414548/Ritual_cxrq4f.png"],
    bundleContents: ["Choose any 2 coffee bags (12 oz)"],
    description: "A calm entry into the Velure ritual, built for consistency and range. The Ritual Set includes two 12 oz coffee bags so you can keep one profile for weekdays and another for slower mornings, without compromising on quality or finish.",
    details: {
      origin: "Curated multi-origin",
      roast: "Medium",
      ingredients: "Assorted coffee selections chosen at checkout",
      weight: "2 x 12 oz / 680g total"
    },
    nutritionSpecs: {
      ingredients: "Varies by selected coffees",
      region: "Varies by selection",
      productAmount: "2 bags / 24 oz total",
      grossWeight: "1.6 lbs shipping weight",
      suggestedUse: "Select your coffees, grind/brew as preferred. For instant, add water and stir."
    }
  },
  {
    id: "bundle-starter",
    name: "STARTER",
    subtitle: "Beans + Instant",
    price: 56.00,
    category: "bundles",
    tag: "Bundle",
    subscriptionEligible: false,
    images: ["https://res.cloudinary.com/dfygdydcj/image/upload/v1772414548/Starter_fnnhi2.png"],
    bundleContents: ["1 coffee bag (12 oz)", "1 instant coffee (54 g)"],
    description: "A balanced starter format for flexible routines: one 12 oz coffee bag for brewed cups and one instant format for speed. STARTER is designed for mornings that alternate between deliberate brewing and efficient, polished preparation.",
    details: {
      origin: "Curated multi-origin",
      roast: "Medium",
      ingredients: "Assorted coffee selections chosen at checkout",
      weight: "12 oz bag + 1.9 oz instant"
    },
    nutritionSpecs: {
      ingredients: "Varies by selected coffees",
      region: "Varies by selection",
      productAmount: "1 bag + 1 instant",
      grossWeight: "1.0 lbs shipping weight",
      suggestedUse: "Select your coffees, grind/brew as preferred. For instant, add water and stir."
    }
  },
  {
    id: "bundle-dark-set",
    name: "DARK SET",
    subtitle: "Bold Roast Bundle",
    price: 50.00,
    category: "bundles",
    tag: "Bundle",
    subscriptionEligible: false,
    images: ["https://res.cloudinary.com/dfygdydcj/image/upload/v1772414548/Dark_rnx5i9.png"],
    bundleContents: ["2 dark-roast coffees (format varies by inventory)"],
    description: "A composed dark-roast bundle built for fuller body and deeper cup structure. DARK SET pairs two bold coffees selected for richness, making it a practical option for espresso-style brewing, press, or strong daily drip.",
    details: {
      origin: "Curated multi-origin",
      roast: "Dark",
      ingredients: "Assorted dark-roast coffee selections",
      weight: "2 selections / approx. 24 oz total"
    },
    nutritionSpecs: {
      ingredients: "Varies by selected coffees",
      region: "Varies by selection",
      productAmount: "2 coffee selections",
      grossWeight: "1.6 lbs shipping weight",
      suggestedUse: "Select your coffees, grind/brew as preferred. For instant, add water and stir."
    }
  },
  {
    id: "bundle-bright-set",
    name: "BRIGHT SET",
    subtitle: "Light Roast Bundle",
    price: 50.00,
    category: "bundles",
    tag: "Bundle",
    subscriptionEligible: false,
    images: ["https://res.cloudinary.com/dfygdydcj/image/upload/v1772414548/Light_mepzfs.png"],
    bundleContents: ["2 light-roast coffees (format varies by inventory)"],
    description: "A bright, clarity-forward bundle designed for clean finishes and lively cups. BRIGHT SET combines two light-roast profiles selected for citrus lift and definition across pour-over, drip, and iced preparations.",
    details: {
      origin: "Curated multi-origin",
      roast: "Light",
      ingredients: "Assorted light-roast coffee selections",
      weight: "2 selections / approx. 24 oz total"
    },
    nutritionSpecs: {
      ingredients: "Varies by selected coffees",
      region: "Varies by selection",
      productAmount: "2 coffee selections",
      grossWeight: "1.6 lbs shipping weight",
      suggestedUse: "Select your coffees, grind/brew as preferred. For instant, add water and stir."
    }
  }
];

const ROUTE_PATHS = {
  home: '/',
  shop_all: '/collections',
  shop_functional: '/collections/functional',
  shop_signature: '/collections/signature',
  shop_single_origin: '/collections/single-origin',
  shop_bundles: '/collections/bundles',
  blog: '/blog',
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

const CATEGORY_LABELS = {
  all: 'All Collections',
  functional: 'Functional Blends',
  signature: 'Signature Blends',
  single_origin: 'Single Origin Series',
  bundles: 'Bundle Sets',
};

const VELURE_STANDARD_FACTS = [
  'Gluten Free',
  'Vegetarian',
  'Lactose Free',
  'Allergen Free',
  'Hormone Free',
  '100% Natural',
  'Antibiotic Free',
  'Non-GMO',
  'Corn Free',
  'Vegan',
  'Halal Certified',
  'Cruelty Free',
];

const SUBSCRIPTION_SELECTION_STORAGE_KEY = 'velure_selected_subscription_product_v1';
const DEFAULT_RITUAL_MEMBERSHIP_RATE = 0.15;
const FOUNDING_MEMBER_RATE = 0.2;

const FUNCTIONAL_BENEFIT_COPY = {
  'Lion’s Mane': 'Clarity & focus',
  'Chaga': 'Immune support',
  'Cordyceps': 'Energy & endurance',
  'Hemp Protein': 'Plant-powered body & balance',
};

const PRODUCT_RITUAL_NOTES = {
  fuse: {
    regionLabel: 'Eastern Highlands, Papua New Guinea',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
    functionalIngredients: ['Lion’s Mane', 'Chaga'],
  },
  vitality: {
    regionLabel: 'Minas Gerais, Brazil and Chiapas, Mexico',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
    functionalIngredients: ['Lion’s Mane', 'Chaga'],
  },
  onyx: {
    regionLabel: 'Eastern Highlands, Papua New Guinea',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
  },
  aureo: {
    regionLabel: 'Cerrado, Brazil',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
  },
  zen: {
    regionLabel: 'Kagoshima, Japan',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
  },
  harvest: {
    regionLabel: 'Minas Gerais, Brazil and Chiapas, Mexico',
    ritualMembershipRate: DEFAULT_RITUAL_MEMBERSHIP_RATE,
    foundingMemberRate: FOUNDING_MEMBER_RATE,
    functionalIngredients: ['Hemp Protein'],
  },
};

const HOME_TESTIMONIALS = [
  {
    name: 'Sarah M.',
    location: 'New York, NY',
    review: 'This has become the part of my morning I look forward to most. The cup feels smooth and polished, and the Lion’s Mane blend gives me a clear, steady kind of focus that feels natural.',
  },
  {
    name: 'James K.',
    location: 'Austin, TX',
    review: 'I bought Velure for the flavor first, and that is what keeps me coming back. It tastes rich without feeling heavy, and the ritual membership has made my kitchen feel a little more considered every month.',
  },
  {
    name: 'Priya D.',
    location: 'London, UK',
    review: 'The functional blend is the first coffee I have had that feels both elegant and genuinely useful. I get the comfort of a beautiful cup, but I also notice a calmer kind of energy through the morning.',
  },
];

const GIFTING_CURATIONS = [
  {
    title: 'Single Bag Gift',
    subtitle: 'For her morning ritual',
    description: 'A full-size Velure bag in our premium packaging, chosen for mornings that deserve a more thoughtful start.',
    ctaLabel: 'Shop Gift-Worthy Bags',
    targetView: 'shop_single_origin',
  },
  {
    title: '3-Month Ritual Membership Gift',
    subtitle: 'The gift of intention',
    description: 'Offer three months of a recurring ritual with a founding-member membership rate designed to feel lasting, not promotional.',
    ctaLabel: 'Gift Ritual Membership',
    targetView: 'subscription',
  },
];

const getProductRitualNotes = (product) => PRODUCT_RITUAL_NOTES[normalizeLower(product?.id || '')] || {};
const getMembershipRateForProduct = (product) => {
  if (!product || product.category === 'bundles') return 0;
  return Number(getProductRitualNotes(product).ritualMembershipRate || DEFAULT_RITUAL_MEMBERSHIP_RATE);
};
const getMembershipPriceForProduct = (product) => {
  const rate = getMembershipRateForProduct(product);
  if (!rate) return Number(product?.price || 0);
  return Number(((Number(product?.price || 0)) * (1 - rate)).toFixed(2));
};
const getFoundingMemberPriceForProduct = (product) => {
  const rate = Number(getProductRitualNotes(product).foundingMemberRate || FOUNDING_MEMBER_RATE);
  return Number(((Number(product?.price || 0)) * (1 - rate)).toFixed(2));
};
const getProminentOriginLabel = (product) => getProductRitualNotes(product).regionLabel || product?.nutritionSpecs?.region || product?.details?.origin || '';
const getFunctionalIngredientsForProduct = (product) => {
  const names = getProductRitualNotes(product).functionalIngredients;
  if (!Array.isArray(names) || names.length === 0) return [];
  return names.map((name) => ({
    name,
    benefit: FUNCTIONAL_BENEFIT_COPY[name] || 'intentional daily support',
  }));
};

const BLOG_POSTS = [
  {
    title: 'How to Make Instant Coffee Taste Premium',
    slug: 'make-instant-coffee-taste-premium',
    metaTitle: 'How to Make Instant Coffee Taste Premium (5 Clean Upgrades) | Velure',
    metaDescription: 'A calm, practical guide to making instant coffee taste premium—better ratios, water temp, mixing, milk, and iced methods. No gimmicks, just ritual.',
    description: 'A calm, practical guide to making instant coffee taste premium with repeatable, clean upgrades.',
    publishedAt: '2026-03-17',
    readTime: '6 min read',
    tags: ['instant coffee', 'brew guide', 'ritual', 'taste'],
    featured: true,
    heroImage: '/images/blog/blog-instant-premium-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-instant-premium-support-1.png',
        alt: 'Step-by-step dissolve method for instant coffee in a matte black cup',
      },
      {
        src: '/images/blog/blog-instant-premium-support-2.png',
        alt: 'Editorial graphic that reads 5 upgrades for premium instant',
      },
    ],
    content: `Instant coffee can be fast and refined if you treat it like craft, not a shortcut.

This guide is built for one thing: a better cup, with clean inputs and small upgrades you can repeat daily.

## 1) Start with the ratio (the fastest quality upgrade)
Most instant coffee tastes thin because it is overdiluted.

Try this starting point:
- 1 tablespoon instant coffee into 8 to 10 fl oz water
- If you want it bolder, use less water before adding anything else

The goal is balance: body first, then softness.

## 2) Use the right water temperature
Water that is too cool will not fully dissolve, and boiling water can flatten nuance.

Best range: hot, but not aggressively boiling.
If you can, let boiled water sit briefly before pouring.

## 3) Dissolve like you mean it
A premium cup is smooth. No grit, no clumps.

Method:
1. Add your coffee to the mug
2. Pour a small splash of hot water first
3. Stir until fully dissolved
4. Top up to final volume

This tiny bloom step improves texture immediately.

## 4) Choose one refinement: milk, foam, or spice
Keep it minimal. One accent is enough.

Option A: Creamy
- Add a small amount of milk or oat after fully dissolving

Option B: Foamed
- Foam milk separately and top gently

Option C: Warm spice
- A pinch of cinnamon or cacao on top

The rule: one element, not a dozen.

## 5) Iced instant that does not taste watered down
Iced coffee fails when ice becomes the recipe.

Method:
1. Dissolve coffee in a smaller amount of hot water
2. Pour over ice
3. Top with cold water or milk to taste

This keeps intensity while still drinking clean.

## A premium instant ritual, in 60 seconds
If you want instant coffee to feel like Velure, make it a ritual:
- A clean mug
- A consistent ratio
- A quiet moment before the day accelerates

If you are building your daily cup around ingredient clarity and smooth medium-roast character, start here:
FUSE — premium instant designed for an intentional morning.

Note: This article is for general information and taste guidance, not medical advice.`,
    relatedProducts: [
      { productId: 'fuse', blurb: 'FUSE — medium roast functional instant.' },
      { productId: 'onyx', blurb: 'ONYX — dark roast single-origin instant.' },
    ],
  },
  {
    title: 'Lion’s Mane Coffee, Explained (Without the Hype)',
    slug: 'lions-mane-coffee-explained',
    metaTitle: 'Lion’s Mane Coffee, Explained (Without the Hype) | Velure',
    metaDescription: 'What lion’s mane coffee is, why brands add it, what it tastes like, and what to look for on labels—calm, factual, and clean.',
    description: 'A calm, factual guide to Lion’s Mane coffee, label literacy, and what quality looks like.',
    publishedAt: '2026-03-10',
    readTime: '5 min read',
    tags: ['lion’s mane', 'functional coffee', 'clean label', 'ingredients'],
    featured: false,
    heroImage: '/images/blog/blog-lions-mane-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-lions-mane-support-1.png',
        alt: 'Macro shot of lion’s mane powder beside instant coffee granules',
      },
      {
        src: '/images/blog/blog-lions-mane-support-2.png',
        alt: 'Minimal ingredient card concept on cream paper over black background',
      },
    ],
    content: `Lion’s Mane coffee has become a modern staple in functional blends, but the conversation around it is often louder than it needs to be.

Here is the calm, factual version: what it is, why it is used, and how to judge quality through the label.

## What is Lion’s Mane?
Lion’s Mane is a culinary mushroom often used in powdered form in functional blends. In coffee, it is typically added to support an intentional ritual positioning without changing the core expectation: the coffee still has to taste great.

## What does it taste like in coffee?
In well-formulated blends, Lion’s Mane tends to read as:
- soft earthy depth
- gentle roundness
- a grounded finish

When it is overdosed or poorly blended, the cup can taste dusty or too mushroom-forward.

## The label tells you everything
Most confusion disappears when you read the ingredient panel.

Look for:
- clear naming with no vague proprietary blend language
- clean, simple ingredients
- transparency on how much is included (percentages or grams)

A premium ritual brand should be able to show you what is inside.

## How Velure approaches it
Velure blends are built to stay readable and restrained.

For example, FUSE lists exact proportions:
- 70% roasted Arabica coffee
- 15% organic Lion’s Mane
- 15% organic Chaga

That is the standard we like: clear math, clean inputs, and no performance theatrics.

## The real question: does it fit your ritual?
Lion’s Mane coffee is not about chasing a miracle. It is about whether you want:
- a cup that feels more intentional
- ingredients you can explain
- a clean blend you will return to daily

If that is the goal, start with transparency and taste first.

Note: This article is for general information and label literacy, not medical advice. Avoid brands that promise disease-related outcomes.`,
    relatedProducts: [
      { productId: 'fuse', blurb: 'FUSE — Lion’s Mane + Chaga instant.' },
      { productId: 'vitality', blurb: 'VITALITY — Lion’s Mane + Chaga ground coffee.' },
    ],
  },
  {
    title: 'Chaga Coffee, Explained (A Clean, Grounded Guide)',
    slug: 'chaga-coffee-explained',
    metaTitle: 'Chaga Coffee, Explained (A Clean, Grounded Guide) | Velure',
    metaDescription: 'A simple guide to chaga coffee: what chaga is, what it tastes like, why it is used, and how to choose clean blends without gimmicks.',
    description: 'A grounded guide to chaga coffee, taste profile, and clean formulation standards.',
    publishedAt: '2026-03-03',
    readTime: '5 min read',
    tags: ['chaga', 'functional coffee', 'clean label', 'ingredients'],
    featured: false,
    heroImage: '/images/blog/blog-chaga-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-chaga-support-1.png',
        alt: 'Close-up texture shot of chaga powder in matte ceramic bowl',
      },
      {
        src: '/images/blog/blog-chaga-support-2.png',
        alt: 'What to look for on a label checklist graphic on black background',
      },
    ],
    content: `Chaga shows up in premium functional coffees for one main reason: it brings a deeper, darker note that can pair beautifully with coffee when it is done with restraint.

This is your calm guide to understanding it.

## What is Chaga?
Chaga is a fungus traditionally prepared as a tea-like infusion or used as a powder in modern blends.

In coffee, it is used less as a flavor and more as a supporting note, the way cacao or spice can deepen a profile without dominating it.

## What does chaga taste like in coffee?
Chaga can read as:
- earthy and dark
- slightly woodsy
- smooth, grounding depth

In a premium blend, it should feel integrated, not like a separate mushroom layer.

## How to choose chaga coffee without getting misled
Ignore loud promises and read the label.

Green flags:
- a short, single-purpose ingredient list
- organic listed where possible
- clear proportions or meaningful serving information
- minimal additives

Red flags:
- oversized claim language
- unclear blend composition
- long ingredient lists that dilute the coffee

## A transparent example
Velure uses ingredient clarity.

FUSE lists:
- 70% roasted Arabica coffee
- 15% organic Lion’s Mane
- 15% organic Chaga

No filler logic.

## Make it part of a ritual, not a performance
If chaga coffee works for you, it is because it fits your day:
- quick preparation
- grounded taste
- clean formulation
- consistent repeatability

That is the real premium: a ritual you can keep.

Note: This article is general information and label literacy, not medical advice. Avoid brands that imply disease treatment or guaranteed outcomes.`,
    relatedProducts: [
      { productId: 'vitality', blurb: 'VITALITY — daily medium roast with Lion’s Mane + Chaga.' },
      { productId: 'fuse', blurb: 'FUSE — clean functional instant format.' },
    ],
  },
  {
    title: 'What “Clean Label” Actually Means for Coffee + Functional Blends',
    slug: 'clean-label-functional-coffee',
    metaTitle: 'Clean Label Coffee: What It Means (and What to Avoid) | Velure',
    metaDescription: 'Clean label, explained: what to look for in coffee + functional blends, how to spot filler ingredients, and how transparency builds trust.',
    description: 'How to evaluate clean-label coffee and functional blends with practical, no-hype criteria.',
    publishedAt: '2026-02-24',
    readTime: '7 min read',
    tags: ['clean label', 'transparency', 'ingredients', 'functional coffee'],
    featured: true,
    heroImage: '/images/blog/blog-clean-label-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-clean-label-support-1.png',
        alt: 'Flat lay of ingredient bowls and printed ingredient list card',
      },
      {
        src: '/images/blog/blog-clean-label-support-2.png',
        alt: 'Clean label checklist graphic with gold dividers',
      },
    ],
    content: `Clean label can mean many things online. For Velure, it means something specific:

You should be able to read the ingredients, understand them, and feel good about repeating the ritual daily.

## 1) Short ingredient lists win
The cleanest products are often the simplest:
- coffee
- a small number of functional ingredients
- nothing unnecessary

Long lists are not automatically bad, but they increase the odds of fillers and marketing haze.

## 2) Watch for vague blends
The phrase proprietary blend is not always wrong, but it hides proportions.

For functional coffee, transparency matters. Look for:
- exact percentages
- grams per serving
- clear sourcing language where possible

## 3) Check for taste masking
When functional ingredients are added poorly, brands sometimes compensate with:
- heavy sweeteners
- strong flavorings
- artificial creaminess

If a product needs disguises, it is usually not built on craft.

## 4) Clean label is also about restraint
Clean does not mean claims. It means:
- fewer ingredients
- clear language
- verifiable statements
- no disease-related promises

Premium is calm and factual.

## 5) What Velure does differently
We treat transparency like design.

FUSE is intentionally readable:
- 70% roasted Arabica coffee
- 15% organic Lion’s Mane
- 15% organic Chaga

A clean ingredient story and a refined daily cup.

## Your clean-label checklist
Use this when scanning any product:
- Can I read every ingredient?
- Is it clear how much is included?
- Is the language factual and not medical?
- Would I feel confident consuming this daily?
- Does it prioritize taste?

If yes, you are in the right territory.

Note: General information only. For personal health questions, consult a qualified professional.`,
    relatedProducts: [
      { productId: 'fuse', blurb: 'FUSE — transparent functional instant.' },
      { productId: 'vitality', blurb: 'VITALITY — functional ground coffee.' },
      { productId: 'harvest', blurb: 'HARVEST — coffee + hemp protein blend.' },
      { productId: 'zen', blurb: 'ZEN — 100% ceremonial matcha.' },
    ],
  },
  {
    title: 'Hot vs Iced Instant Coffee (The Best Methods for Each)',
    slug: 'hot-vs-iced-instant-coffee',
    metaTitle: 'Hot vs Iced Instant Coffee: Best Methods + Ratios | Velure',
    metaDescription: 'Make instant coffee taste premium hot or iced. The right dissolve method, ratio guidance, and a calm routine you can repeat daily.',
    description: 'Better hot and iced instant methods with clean ratios and no gimmicks.',
    publishedAt: '2026-02-17',
    readTime: '5 min read',
    tags: ['instant coffee', 'iced coffee', 'brew guide', 'ritual'],
    featured: false,
    heroImage: '/images/blog/blog-hot-vs-iced-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-hot-vs-iced-support-1.png',
        alt: 'Close-up pour of concentrated coffee over ice',
      },
      {
        src: '/images/blog/blog-hot-vs-iced-support-2.png',
        alt: 'Hot vs Iced method comparison graphic',
      },
    ],
    content: `Instant coffee is one of the most versatile formats in modern coffee, especially when you do it intentionally.

Here is how to make a hot cup that feels refined and an iced cup that does not taste watered down.

## The universal rule: dissolve first
Whether hot or iced, your cup improves when you dissolve coffee fully before dilution.

Method:
1. Coffee into mug
2. Small splash of hot water
3. Stir until smooth
4. Build the cup

## Hot: keep it clean and balanced
For a premium hot cup:
- start with a consistent ratio
- use hot water that is not aggressively boiling
- stir until fully smooth

Then decide on one minimalist add-on:
- small milk addition for softness
- light spice accent for warmth

## Iced: build concentrate, then chill
Iced coffee fails when ice becomes the recipe.

Better method:
1. Dissolve coffee in a smaller amount of hot water
2. Pour over ice
3. Top with cold water or milk

This keeps intensity and texture.

## Taste should lead
Functional blends are only premium if you want to drink them daily.

FUSE is designed for smooth, medium-roast character, built for hot or iced ritual with clean ingredients and transparent proportions.

## Your two simple rituals
Hot ritual: dissolve, top, sip.
Iced ritual: dissolve, ice, finish.

Consistency becomes luxury.

Note: General information and taste guidance only.`,
    relatedProducts: [
      { productId: 'onyx', blurb: 'ONYX — dark roast instant, single-origin.' },
      { productId: 'fuse', blurb: 'FUSE — medium roast functional instant.' },
    ],
  },
  {
    title: 'A 5-Minute Morning Coffee Ritual (That You’ll Actually Keep)',
    slug: '5-minute-morning-coffee-ritual',
    metaTitle: 'A 5-Minute Morning Coffee Ritual (Simple + Calm) | Velure',
    metaDescription: 'A calm 5-minute coffee ritual: setup, brew, breath, and repeat. Designed for consistency—premium simplicity, not performance.',
    description: 'A practical five-minute ritual that keeps your mornings calm, premium, and repeatable.',
    publishedAt: '2026-02-10',
    readTime: '5 min read',
    tags: ['ritual', 'morning routine', 'coffee', 'mindful habits'],
    featured: true,
    heroImage: '/images/blog/blog-morning-ritual-hero.png',
    supportingImages: [
      {
        src: '/images/blog/blog-morning-ritual-support-1.png',
        alt: 'Hands holding a warm mug in soft morning window light',
      },
      {
        src: '/images/blog/blog-morning-ritual-support-2.png',
        alt: 'Ritual checklist graphic showing 5-minute coffee routine',
      },
    ],
    content: `The best ritual is not dramatic. It is repeatable.

This is a five-minute morning coffee ritual designed to feel premium without becoming complicated.

## Minute 1: Prepare the space
A ritual begins before the cup.
- clear one small surface
- choose one mug you love
- remove visual clutter, even briefly

Premium is often subtraction.

## Minute 2: Brew with intention
Make the cup the same way each day.

If using instant coffee:
- coffee into mug
- dissolve smoothly
- build hot or iced

Consistency becomes comfort.

## Minute 3: Pause quietly
Before your first sip:
- inhale slowly
- exhale longer than you inhale
- let the day wait for ten seconds

A small pause shifts the whole morning.

## Minute 4: Sip without multitasking
Even one undistracted sip resets pace.

No phone. No inbox. Just the cup.

## Minute 5: Close the ritual
End cleanly:
- rinse the mug
- reset the counter
- leave the space ready for tomorrow

That is how habits stick.

## Make the ritual effortless
FUSE is built for this kind of morning: premium instant coffee with clean, transparent ingredients designed to dissolve smoothly and repeat daily.

Note: General lifestyle content only.`,
    relatedProducts: [
      { productId: 'zen', blurb: 'ZEN — ceremonial matcha ritual.' },
      { productId: 'aureo', blurb: 'AUREO — single-origin whole bean ritual.' },
      { productId: 'vitality', blurb: 'VITALITY — medium roast functional brew.' },
    ],
  },
];

let currentProductsCatalog = [...PRODUCTS];
let currentBlogPostsCatalog = [...BLOG_POSTS];

const getProductsCatalog = () => currentProductsCatalog;
const setProductsCatalog = (nextProducts) => {
  currentProductsCatalog = Array.isArray(nextProducts) && nextProducts.length ? nextProducts : [...PRODUCTS];
};
const getSubscriptionProducts = () => getProductsCatalog().filter((product) => product.subscriptionEligible);
const getBlogPostsCatalog = () => currentBlogPostsCatalog;
const setBlogPostsCatalog = (nextPosts) => {
  currentBlogPostsCatalog = Array.isArray(nextPosts) && nextPosts.length ? nextPosts : [...BLOG_POSTS];
};
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const ensureObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const normalizeSupabaseProduct = (row = {}) => {
  const details = ensureObject(row.details);
  const nutritionSpecs = ensureObject(row.nutrition_specs || row.nutritionSpecs);
  return {
    id: normalizeLower(row.id || ''),
    name: typeof row.name === 'string' ? row.name : '',
    subtitle: typeof (row.subtitle || row.tagline) === 'string' ? (row.subtitle || row.tagline) : '',
    price: Number(row.price || 0),
    category: typeof row.category === 'string' ? row.category : 'functional',
    tag: typeof row.tag === 'string' ? row.tag : (ensureArray(row.badges)[0] || ''),
    subscriptionEligible: row.subscription_eligible !== false,
    featuredHome: Boolean(row.featured_home ?? row.is_featured ?? false),
    images: ensureArray(row.images).filter((item) => typeof item === 'string' && item.trim()),
    description: typeof row.description === 'string' ? row.description : '',
    details: {
      origin: typeof (row.origin || details.origin) === 'string' ? (row.origin || details.origin) : '',
      roast: typeof (row.roast || details.roast) === 'string' ? (row.roast || details.roast) : '',
      ingredients: typeof details.ingredients === 'string' ? details.ingredients : '',
      weight: typeof details.weight === 'string' ? details.weight : (typeof nutritionSpecs.productAmount === 'string' ? nutritionSpecs.productAmount : ''),
      format: typeof (row.format || details.format) === 'string' ? (row.format || details.format) : '',
      series: typeof (row.series || details.series) === 'string' ? (row.series || details.series) : '',
    },
    nutritionSpecs,
    ingredients: ensureArray(row.ingredients),
    benefits: ensureArray(row.benefits),
    badges: ensureArray(row.badges),
    origin: typeof row.origin === 'string' ? row.origin : '',
    roast: typeof row.roast === 'string' ? row.roast : '',
    format: typeof row.format === 'string' ? row.format : '',
    series: typeof row.series === 'string' ? row.series : '',
    weight_lbs: Number(row.weight_lbs || 0),
    is_active: Boolean(row.is_active ?? true),
    is_featured: Boolean(row.is_featured ?? false),
    sort_order: Number(row.sort_order || 0),
  };
};
const normalizeSupabaseBlogPost = (row = {}) => ({
  title: typeof row.title === 'string' ? row.title : '',
  slug: typeof row.slug === 'string' ? row.slug : '',
  metaTitle: typeof (row.meta_title || row.metaTitle) === 'string' ? (row.meta_title || row.metaTitle) : '',
  metaDescription: typeof (row.meta_description || row.metaDescription || row.subtitle) === 'string' ? (row.meta_description || row.metaDescription || row.subtitle) : '',
  description: typeof (row.subtitle || row.description) === 'string' ? (row.subtitle || row.description) : '',
  publishedAt: typeof (row.published_at || row.publishedAt) === 'string' ? (row.published_at || row.publishedAt) : '',
  readTime: `${Number(row.read_time_minutes || row.readTimeMinutes || 5)} min read`,
  readTimeMinutes: Number(row.read_time_minutes || row.readTimeMinutes || 5),
  tags: ensureArray(row.tags),
  featured: Boolean(row.featured),
  heroImage: typeof (row.featured_image || row.heroImage) === 'string' ? (row.featured_image || row.heroImage) : '',
  supportingImages: ensureArray(row.supporting_images || row.supportingImages),
  content: typeof (row.body || row.content) === 'string' ? (row.body || row.content) : '',
  relatedProducts: ensureArray(row.related_products || row.relatedProducts).map((item) => typeof item === 'string' ? item : item?.productId).filter(Boolean),
  author: typeof row.author === 'string' ? row.author : 'Joe Hart',
});

const DEFAULT_BLOG_RELATED_PRODUCT_IDS = ['fuse', 'aureo', 'onyx'];
const BLOG_RELATED_PRODUCTS_BY_SLUG = {
  'make-instant-coffee-taste-premium': ['fuse', 'onyx'],
  'hot-vs-iced-instant-coffee': ['fuse', 'onyx'],
  'clean-label-functional-coffee': ['fuse', 'vitality', 'zen'],
  'lions-mane-coffee-explained': ['fuse', 'vitality', 'zen'],
  'chaga-coffee-explained': ['fuse', 'vitality', 'zen'],
  '5-minute-morning-coffee-ritual': ['aureo', 'zen', 'bundle-ritual-set'],
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
To submit a request, contact: concierge@velurecoffee.com.

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
Email: concierge@velurecoffee.com`,
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
Questions about these Terms: concierge@velurecoffee.com`,
  shippingReturns: `Last Updated: February 13, 2026

1. Shipping Coverage
Velure ships to the contiguous United States (48 states), Canada, and selected international countries shown at checkout.

2. Countries We Currently Ship To
- U.S. (contiguous 48 states)
- Zone 1: Canada
- Zone 2: Belgium, Denmark, Finland, France, Iceland, Italy, Liechtenstein, Luxembourg, Malta, Monaco, Netherlands, Norway, Portugal, Sweden, United Kingdom
- Zone 3: Australia, Bulgaria, Croatia, Cyprus, Czech Republic, Estonia, Hungary, Indonesia, Latvia, Lithuania, Macau SAR, New Zealand, Philippines, Poland, Romania, Slovakia, Slovenia, South Korea, Thailand, Vietnam

3. Destinations Not Currently Available
- Spain is not currently available.
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
If your order arrives damaged or incomplete, contact concierge@velurecoffee.com within 7 days of delivery with photos and order details.

10. Return Eligibility
Unopened products in original condition may be returned within 30 days of delivery unless marked final sale.

11. Non-Returnable Items
For food safety reasons, opened consumable products are generally non-returnable unless defective or required by applicable law.

12. Return Process
Email concierge@velurecoffee.com with your order number and reason for return. If approved, we will provide return instructions.

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

const clampCartQty = (value) => {
  const parsedValue = Math.floor(Number(value) || 1);
  return Math.max(1, Math.min(10, parsedValue));
};
const sanitizeBundleSelection = (value) => {
  if (!Array.isArray(value?.slots)) return null;
  const normalizeString = (input) => (typeof input === 'string' ? input.trim() : '');
  const slots = value.slots
    .map((slot) => ({
      slotKey: normalizeString(slot?.slotKey),
      slotLabel: normalizeString(slot?.slotLabel),
      productId: normalizeString(slot?.productId),
      name: normalizeString(slot?.name),
      subtitle: normalizeString(slot?.subtitle),
      image: normalizeString(slot?.image),
    }))
    .filter((slot) => slot.slotKey && slot.productId && slot.name);
  return slots.length ? { slots } : null;
};
const getProductById = (productId) => {
  const normalizedProductId = normalizeLower(productId);
  return getProductsCatalog().find((product) => product.id === normalizedProductId) || null;
};
const normalizeCartItems = (rawCart) => {
  if (!Array.isArray(rawCart)) return [];

  const normalizedItems = [];
  const productToIndex = new Map();
  const upsertItem = (productIdInput, quantityInput = 1, bundleSelectionInput = null) => {
    const productId = normalizeLower(productIdInput);
    if (!productId || !getProductById(productId)) return;

    const safeQuantity = clampCartQty(quantityInput);
    const sanitizedBundleSelection = sanitizeBundleSelection(bundleSelectionInput);
    const existingIndex = productToIndex.get(productId);

    if (Number.isInteger(existingIndex)) {
      const existingItem = normalizedItems[existingIndex];
      normalizedItems[existingIndex] = {
        ...existingItem,
        quantity: clampCartQty(existingItem.quantity + safeQuantity),
        ...(sanitizedBundleSelection ? { bundleSelection: sanitizedBundleSelection } : {}),
      };
      return;
    }

    productToIndex.set(productId, normalizedItems.length);
    normalizedItems.push({
      productId,
      quantity: safeQuantity,
      ...(sanitizedBundleSelection ? { bundleSelection: sanitizedBundleSelection } : {}),
    });
  };

  rawCart.forEach((entry) => {
    if (typeof entry === 'string') {
      upsertItem(entry, 1, null);
      return;
    }

    if (!entry || typeof entry !== 'object') {
      return;
    }

    const productId = normalizeLower(entry.productId || entry.id);
    if (!productId) return;

    const hasQuantityValue = Number.isFinite(Number(entry.quantity ?? entry.qty));
    const quantity = hasQuantityValue ? Number(entry.quantity ?? entry.qty) : 1;
    const bundleSelection = sanitizeBundleSelection(entry.bundleSelection);
    upsertItem(productId, quantity, bundleSelection);
  });

  return normalizedItems;
};
const getCheckoutItemsFromCart = (cartItems) => {
  return normalizeCartItems(cartItems).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));
};
const getCartSubtotal = (cartItems) => {
  return getCheckoutItemsFromCart(cartItems).reduce((sum, item) => {
    const product = getProductById(item.productId);
    if (!product) return sum;
    return sum + (product.price * item.quantity);
  }, 0);
};
const getCartTotalQuantity = (cartItems) => {
  return getCheckoutItemsFromCart(cartItems).reduce((sum, item) => sum + item.quantity, 0);
};
const getCartDisplayItems = (cartItems) => {
  const normalizedItems = normalizeCartItems(cartItems);
  return normalizedItems
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return {
        ...product,
        productId: item.productId,
        quantity: item.quantity,
        lineTotal: Number((product.price * item.quantity).toFixed(2)),
        bundleSelection: item.bundleSelection || null,
      };
    })
    .filter(Boolean);
};

const getProductAmountLabel = (product) => normalizeLower(product?.nutritionSpecs?.productAmount || product?.details?.weight || '');
const isMatchaProduct = (product) => {
  const subtitle = normalizeLower(product?.subtitle || '');
  return subtitle.includes('matcha') || normalizeLower(product?.name || '') === 'zen';
};
const isPodProduct = (product) => product?.id?.endsWith('-pods') || getProductAmountLabel(product).includes('pods');
const isInstantCoffeeProduct = (product) => {
  const subtitle = normalizeLower(product?.subtitle || '');
  const amount = getProductAmountLabel(product);
  return (subtitle.includes('instant') || amount.includes('1.9 oz')) && !isMatchaProduct(product);
};
const isNonBundleCoffeeProduct = (product) => Boolean(product) && product.category !== 'bundles' && !isMatchaProduct(product);
const isTwelveOzBagProduct = (product) => {
  if (!isNonBundleCoffeeProduct(product)) return false;
  if (isPodProduct(product) || isInstantCoffeeProduct(product)) return false;
  const amount = getProductAmountLabel(product);
  return amount.includes('12 oz') || amount.includes('12oz');
};
const isDarkRoastCoffeeProduct = (product) => isNonBundleCoffeeProduct(product) && normalizeLower(product?.details?.roast || '') === 'dark';
const isLightRoastCoffeeProduct = (product) => isNonBundleCoffeeProduct(product) && normalizeLower(product?.details?.roast || '') === 'light';
const getBundleSlotOptions = (bundleProductId) => {
  const selectableProducts = getProductsCatalog().filter((candidate) => candidate.category !== 'bundles');
  const buildSlot = (key, label, helper, matcher) => ({
    key,
    label,
    helper,
    options: selectableProducts
      .filter(matcher)
      .sort((a, b) => a.name.localeCompare(b.name)),
  });

  if (bundleProductId === 'bundle-ritual-set') {
    return [
      buildSlot('bagOne', 'Coffee Bag 1', 'Choose your first 12 oz bag.', isTwelveOzBagProduct),
      buildSlot('bagTwo', 'Coffee Bag 2', 'Choose your second 12 oz bag.', isTwelveOzBagProduct),
    ];
  }

  if (bundleProductId === 'bundle-starter') {
    return [
      buildSlot('bag', 'Coffee Bag', 'Choose one 12 oz bag.', isTwelveOzBagProduct),
      buildSlot('instant', 'Instant Coffee', 'Choose one instant coffee.', isInstantCoffeeProduct),
    ];
  }

  if (bundleProductId === 'bundle-dark-set') {
    return [
      buildSlot('darkOne', 'Dark Pick 1', 'Choose your first dark-roast coffee.', isDarkRoastCoffeeProduct),
      buildSlot('darkTwo', 'Dark Pick 2', 'Choose your second dark-roast coffee.', isDarkRoastCoffeeProduct),
    ];
  }

  if (bundleProductId === 'bundle-bright-set') {
    return [
      buildSlot('brightOne', 'Bright Pick 1', 'Choose your first light-roast coffee.', isLightRoastCoffeeProduct),
      buildSlot('brightTwo', 'Bright Pick 2', 'Choose your second light-roast coffee.', isLightRoastCoffeeProduct),
    ];
  }

  return [];
};
const getDefaultBundleSelections = (bundleProductId) => getBundleSlotOptions(bundleProductId).reduce((accumulator, slot, index) => {
  const fallbackOption = slot.options[Math.min(index, Math.max(0, slot.options.length - 1))] || slot.options[0];
  if (fallbackOption) {
    accumulator[slot.key] = fallbackOption.id;
  }
  return accumulator;
}, {});

const getBlogPostBySlug = (slug) => getBlogPostsCatalog().find((post) => post.slug === slug) || null;
const getProductPrimaryImage = (product) => {
  const candidate = Array.isArray(product?.images) ? product.images.find((image) => typeof image === 'string' && image.trim()) : '';
  if (candidate && (/^https?:\/\//.test(candidate) || candidate.startsWith('data:image/') || candidate.startsWith('/'))) return candidate;
  return DEFAULT_SHARE_IMAGE_URL;
};
const getBlogImage = (src) => {
  if (typeof src !== 'string') return DEFAULT_SHARE_IMAGE_URL;
  const trimmed = src.trim();
  if (!trimmed) return DEFAULT_SHARE_IMAGE_URL;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  return DEFAULT_SHARE_IMAGE_URL;
};
const handleBlogImageError = (event) => {
  if (!event?.currentTarget) return;
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = DEFAULT_SHARE_IMAGE_URL;
};
const handleProductImageError = (event) => {
  if (!event?.currentTarget) return;
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = DEFAULT_SHARE_IMAGE_URL;
};
const getRelatedProductsForBlogPost = (slug, limit = 3, explicitIds = []) => {
  const mappedIds = Array.isArray(explicitIds) && explicitIds.length
    ? explicitIds
    : (BLOG_RELATED_PRODUCTS_BY_SLUG[slug] || DEFAULT_BLOG_RELATED_PRODUCT_IDS);
  const uniqueIds = [...new Set([...(mappedIds || []), ...DEFAULT_BLOG_RELATED_PRODUCT_IDS])];
  const resolvedProducts = uniqueIds
    .map((productId) => getProductsCatalog().find((product) => product.id === productId))
    .filter(Boolean);
  return resolvedProducts.slice(0, limit);
};

const getRouteFromPath = (pathname) => {
  const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;
  const productMatch = normalizedPathname.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const productId = decodeURIComponent(productMatch[1]);
    return {
      view: 'product_detail',
      productId,
      blogSlug: null,
    };
  }

  const blogPostMatch = normalizedPathname.match(/^\/blog\/([^/]+)$/);
  if (blogPostMatch) {
    const blogSlug = decodeURIComponent(blogPostMatch[1]);
    return {
      view: 'blog_post',
      productId: null,
      blogSlug,
    };
  }

  const matchedView = Object.entries(ROUTE_PATHS).find(([, path]) => path === normalizedPathname)?.[0];
  return {
    view: matchedView || 'home',
    productId: null,
    blogSlug: null,
  };
};

const getPathForView = (view, options = {}) => {
  if (view === 'product_detail' && options.productId) {
    return `/products/${encodeURIComponent(options.productId)}`;
  }

  if (view === 'blog_post' && options.blogSlug) {
    return `/blog/${encodeURIComponent(options.blogSlug)}`;
  }

  return ROUTE_PATHS[view] || ROUTE_PATHS.home;
};

const normalizeLower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const DEFAULT_AUTH_STATE = {
  isLoading: true,
  user: null,
  session: null,
};
const DEFAULT_PASSWORD_RECOVERY_STATE = {
  active: false,
  accessToken: '',
  email: '',
};
const DEFAULT_CUSTOMER_PROFILE = {
  fullName: '',
  phone: '',
  email: '',
  marketingPreferences: {
    email: true,
    sms: false,
  },
  updatedAt: '',
};
const DEFAULT_ACCOUNT_ADDRESS_FORM = {
  label: '',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'US',
  isDefault: false,
};

const mapSupabaseSessionToAuthState = (session) => {
  if (!session || typeof session !== 'object') {
    return {
      user: null,
      session: null,
    };
  }

  const accessToken = typeof session.access_token === 'string' ? session.access_token : '';
  const refreshToken = typeof session.refresh_token === 'string' ? session.refresh_token : '';
  const expiresAtSeconds = Number(session.expires_at);
  const expiresAt = Number.isFinite(expiresAtSeconds) ? expiresAtSeconds * 1000 : 0;
  const userId = typeof session?.user?.id === 'string' ? session.user.id : '';
  const userEmail = typeof session?.user?.email === 'string' ? session.user.email : '';

  if (!accessToken || !refreshToken || !userId) {
    return {
      user: null,
      session: null,
    };
  }

  return {
    user: {
      id: userId,
      email: userEmail,
    },
    session: {
      accessToken,
      refreshToken,
      expiresAt,
    },
  };
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

const loadOrdersFromApi = async (accessToken, limit = 20) => {
  const response = await fetch(`/api/orders?limit=${encodeURIComponent(String(limit))}`, {
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
      : 'Unable to load account orders.';
    throw new Error(message);
  }

  return response.json();
};

const loadCustomerProfileFromApi = async (accessToken) => {
  const response = await fetch('/api/profile', {
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
      : 'Unable to load customer profile.';
    throw new Error(message);
  }

  return response.json();
};

const saveCustomerProfileToApi = async (accessToken, profile) => {
  const response = await fetch('/api/profile', {
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
      : 'Unable to save customer profile.';
    throw new Error(message);
  }

  return response.json();
};

const loadCustomerAddressesFromApi = async (accessToken, limit = 20) => {
  const response = await fetch(`/api/addresses?limit=${encodeURIComponent(String(limit))}`, {
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
      : 'Unable to load customer addresses.';
    throw new Error(message);
  }

  return response.json();
};

const createCustomerAddressInApi = async (accessToken, address) => {
  const response = await fetch('/api/addresses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to save address.';
    throw new Error(message);
  }

  return response.json();
};

const updateCustomerAddressInApi = async (accessToken, addressId, address) => {
  const response = await fetch('/api/addresses', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
    body: JSON.stringify({ addressId, address }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to update address.';
    throw new Error(message);
  }

  return response.json();
};

const deleteCustomerAddressInApi = async (accessToken, addressId) => {
  const response = await fetch(`/api/addresses?addressId=${encodeURIComponent(addressId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to delete address.';
    throw new Error(message);
  }

  return response.json();
};

const loadProductReviewsFromApi = async (productId, accessToken = '') => {
  const response = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to load reviews right now.';
    throw new Error(message);
  }

  return response.json();
};

const saveProductReviewToApi = async (accessToken, review) => {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'same-origin',
    body: JSON.stringify({ review }),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = typeof errorPayload?.error === 'string' && errorPayload.error
      ? errorPayload.error
      : 'Unable to save your review right now.';
    throw new Error(message);
  }

  return response.json();
};

// --- SUB-COMPONENTS ---

const ProductCard = ({ product, openProductDetail }) => (
  <button
    type="button"
    className="group cursor-pointer text-left w-full motion-card"
    onClick={() => openProductDetail(product)}
    aria-label={`View details for ${product.name}`}
  >
    <div className="relative overflow-hidden bg-[#1A1A1A] aspect-[4/5] mb-6">
      <img
        src={getProductPrimaryImage(product)}
        alt={`${product.name} product image`}
        loading="lazy"
        decoding="async"
        onError={handleProductImageError}
        className="absolute inset-0 w-full h-full object-cover motion-card-image"
      />
      <div className="absolute top-4 left-4 bg-[#D4AF37] text-[#0B0C0C] text-xs font-bold px-3 py-1 uppercase tracking-wider">{product.tag}</div>
      <div className="absolute bottom-0 left-0 w-full p-4 motion-card-cta">
        <span className="block w-full text-center bg-[#F9F6F0] text-[#0B0C0C] py-3 font-sans font-bold tracking-wider shadow-lg">
          VIEW RITUAL
        </span>
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-[#F9F6F0] font-serif text-2xl mb-1">{product.name}</h3>
      <p className="text-gray-400 font-sans text-sm mb-2">{product.subtitle}</p>
      <p className="text-[#F9F6F0] font-sans font-medium">${product.price.toFixed(2)}</p>
    </div>
  </button>
);

const ProductDetailView = ({
  product,
  addToCart,
  onBack,
  onOpenSubscription,
  isCartOpen,
  onShareProduct,
  onCopyProductLink,
  authUser,
  authAccessToken,
  onOpenAccount,
}) => {
  const pdpRootRef = useRef(null);
  const mobileStickyBarRef = useRef(null);
  const galleryTouchStartXRef = useRef(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [purchaseOption, setPurchaseOption] = useState('one-time');
  const [openAccordion, setOpenAccordion] = useState('');
  const [bundleSelections, setBundleSelections] = useState(() => getDefaultBundleSelections(product.id));
  const [bundlePreviewProduct, setBundlePreviewProduct] = useState(null);
  const nutritionSpecs = product.nutritionSpecs || null;
  const nutritionRows = nutritionSpecs
    ? [
        nutritionSpecs.varietals ? { label: 'Varietals', value: nutritionSpecs.varietals } : null,
        nutritionSpecs.manufacturerCountry ? { label: 'Produced In', value: nutritionSpecs.manufacturerCountry } : null,
        nutritionSpecs.region ? { label: 'Region', value: nutritionSpecs.region } : null,
        nutritionSpecs.productAmount ? { label: 'Net Amount', value: nutritionSpecs.productAmount } : null,
        nutritionSpecs.grossWeight ? { label: 'Package Weight', value: nutritionSpecs.grossWeight } : null,
      ].filter(Boolean)
    : [];
  const suggestedUseValue = nutritionSpecs?.suggestedUse
    || (product.category === 'bundles'
      ? 'Select your coffees, grind/brew as preferred. For instant, add water and stir.'
      : '');
  const detailsRows = [
    { label: 'Origin', value: product.details.origin },
    product.details.roast ? { label: 'Roast', value: product.details.roast } : null,
    product.details.grade ? { label: 'Grade', value: product.details.grade } : null,
    { label: 'Weight', value: product.details.weight },
  ].filter(Boolean);
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category.replace('_', ' ');
  const mainImage = product.images[mainImageIndex] || product.images[0];
  const isBundleProduct = product.category === 'bundles';
  const hasMembershipOption = !isBundleProduct;
  const membershipRate = getMembershipRateForProduct(product);
  const membershipPercent = Math.round(membershipRate * 100);
  const membershipPrice = getMembershipPriceForProduct(product);
  const foundingMemberPrice = getFoundingMemberPriceForProduct(product);
  const foundingMemberPercent = Math.round((getProductRitualNotes(product).foundingMemberRate || FOUNDING_MEMBER_RATE) * 100);
  const prominentOrigin = getProminentOriginLabel(product);
  const functionalIngredients = getFunctionalIngredientsForProduct(product);
  const bundleSlots = useMemo(
    () => (isBundleProduct ? getBundleSlotOptions(product.id) : []),
    [isBundleProduct, product.id],
  );
  const productClaims = VELURE_STANDARD_FACTS;
  const isBundleSelectionComplete = !isBundleProduct
    || (bundleSlots.length > 0 && bundleSlots.every((slot) => Boolean(bundleSelections[slot.key])));
  const [reviewsState, setReviewsState] = useState({
    isLoading: true,
    error: '',
    items: [],
    stats: { count: 0, averageRating: 0 },
    canReview: false,
    reason: 'Sign in and complete a purchase to leave a review.',
  });
  const [reviewForm, setReviewForm] = useState({
    rating: '5',
    headline: '',
    comment: '',
  });
  const [reviewSubmitState, setReviewSubmitState] = useState({ isSubmitting: false, message: '', type: 'idle' });
  const detailsPanelId = `pdp-accordion-details-${product.id}`;
  const shippingPanelId = `pdp-accordion-shipping-${product.id}`;
  const reviewsPanelId = `pdp-accordion-reviews-${product.id}`;
  const clampQty = useCallback((value) => Math.max(1, Math.min(10, Math.floor(Number(value) || 1))), []);
  const setQuickQty = useCallback((nextQty) => {
    setQty(clampQty(nextQty));
  }, [clampQty]);
  const incrementQty = useCallback((delta) => {
    setQty((previous) => clampQty(previous + delta));
  }, [clampQty]);
  const cycleMainImage = useCallback((direction) => {
    const imageCount = product.images.length;
    if (imageCount <= 1) return;
    setMainImageIndex((previousIndex) => {
      const nextIndex = previousIndex + direction;
      if (nextIndex < 0) return imageCount - 1;
      if (nextIndex >= imageCount) return 0;
      return nextIndex;
    });
  }, [product.images.length]);
  const handleMainImageTouchStart = useCallback((event) => {
    if (!event.touches?.length) return;
    galleryTouchStartXRef.current = event.touches[0].clientX;
  }, []);
  const handleMainImageTouchEnd = useCallback((event) => {
    if (!event.changedTouches?.length || galleryTouchStartXRef.current === null) return;
    const deltaX = galleryTouchStartXRef.current - event.changedTouches[0].clientX;
    galleryTouchStartXRef.current = null;
    if (Math.abs(deltaX) < 40) return;
    cycleMainImage(deltaX > 0 ? 1 : -1);
  }, [cycleMainImage]);
  const getBundleSelectionPayload = useCallback(() => {
    if (!isBundleProduct) return null;
    const slots = bundleSlots
      .map((slot) => {
        const selected = slot.options.find((option) => option.id === bundleSelections[slot.key]);
        if (!selected) return null;
        return {
          slotKey: slot.key,
          slotLabel: slot.label,
          productId: selected.id,
          name: selected.name,
          subtitle: selected.subtitle,
          image: selected.images?.[0] || DEFAULT_SHARE_IMAGE_URL,
        };
      })
      .filter(Boolean);
    return slots.length ? { slots } : null;
  }, [bundleSelections, bundleSlots, isBundleProduct]);
  const handleAddToCart = useCallback((overrideQty) => {
    if (isBundleProduct && !isBundleSelectionComplete) return;
    const quantity = clampQty(overrideQty ?? qty);
    const bundleSelection = getBundleSelectionPayload();
    addToCart(product, quantity, bundleSelection ? { bundleSelection } : undefined);
  }, [
    addToCart,
    clampQty,
    getBundleSelectionPayload,
    isBundleProduct,
    isBundleSelectionComplete,
    product,
    qty,
  ]);
  const toggleAccordion = useCallback((sectionKey) => {
    setOpenAccordion((previous) => (previous === sectionKey ? '' : sectionKey));
  }, []);
  const isDetailsOpen = openAccordion === 'details';
  const isShippingOpen = openAccordion === 'shipping';
  const isReviewsOpen = openAccordion === 'reviews';

  useEffect(() => {
    window.scrollTo(0,0);
  }, [product.id]);

  useEffect(() => {
    setPurchaseOption('one-time');
  }, [isBundleProduct, product.id, product.subscriptionEligible]);

  useEffect(() => {
    const root = pdpRootRef.current;
    if (!root) return undefined;

    const applyBottomSpace = () => {
      if (isCartOpen) {
        root.style.setProperty('--pdp-mobile-bottom-space', '6rem');
        return;
      }

      const stickyBar = mobileStickyBarRef.current;
      const fallback = 'calc(8.5rem + env(safe-area-inset-bottom, 0px))';
      const measured = stickyBar?.offsetHeight ? `${stickyBar.offsetHeight}px` : fallback;
      root.style.setProperty('--pdp-mobile-bottom-space', measured);
    };

    applyBottomSpace();

    let observer = null;
    if (!isCartOpen && typeof ResizeObserver !== 'undefined' && mobileStickyBarRef.current) {
      observer = new ResizeObserver(() => applyBottomSpace());
      observer.observe(mobileStickyBarRef.current);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', applyBottomSpace);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', applyBottomSpace);
      }
    };
  }, [isCartOpen, product.id]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      setReviewsState((previous) => ({ ...previous, isLoading: true, error: '' }));
      setReviewSubmitState({ isSubmitting: false, message: '', type: 'idle' });
      try {
        const payload = await loadProductReviewsFromApi(product.id, authAccessToken || '');
        if (cancelled) return;
        setReviewsState({
          isLoading: false,
          error: '',
          items: Array.isArray(payload?.reviews) ? payload.reviews : [],
          stats: payload?.stats && typeof payload.stats === 'object'
            ? {
                count: Number(payload.stats.count) || 0,
                averageRating: Number(payload.stats.averageRating) || 0,
              }
            : { count: 0, averageRating: 0 },
          canReview: Boolean(payload?.canReview),
          reason: typeof payload?.reason === 'string' && payload.reason.trim()
            ? payload.reason.trim()
            : 'Only customers who purchased this product can leave a review.',
        });
        if (payload?.userReview && typeof payload.userReview === 'object') {
          setReviewForm({
            rating: String(Number(payload.userReview.rating) || 5),
            headline: typeof payload.userReview.headline === 'string' ? payload.userReview.headline.trim() : '',
            comment: typeof payload.userReview.comment === 'string' ? payload.userReview.comment.trim() : '',
          });
        } else {
          setReviewForm({ rating: '5', headline: '', comment: '' });
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load reviews right now.';
        setReviewsState({
          isLoading: false,
          error: message,
          items: [],
          stats: { count: 0, averageRating: 0 },
          canReview: false,
          reason: 'Reviews are temporarily unavailable.',
        });
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [authAccessToken, product.id]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!authUser || !authAccessToken) {
      setReviewSubmitState({ isSubmitting: false, type: 'error', message: 'Sign in first to leave a review.' });
      return;
    }
    if (!reviewsState.canReview) {
      setReviewSubmitState({ isSubmitting: false, type: 'error', message: reviewsState.reason || 'Only verified customers can review this product.' });
      return;
    }
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 8) {
      setReviewSubmitState({ isSubmitting: false, type: 'error', message: 'Please write at least 8 characters.' });
      return;
    }

    setReviewSubmitState({ isSubmitting: true, message: '', type: 'idle' });
    try {
      const payload = await saveProductReviewToApi(authAccessToken, {
        productId: product.id,
        rating: Number(reviewForm.rating || 5),
        headline: reviewForm.headline.trim(),
        comment: reviewForm.comment.trim(),
      });

      setReviewsState((previous) => ({
        ...previous,
        items: Array.isArray(payload?.reviews) ? payload.reviews : previous.items,
        stats: payload?.stats && typeof payload.stats === 'object'
          ? {
              count: Number(payload.stats.count) || 0,
              averageRating: Number(payload.stats.averageRating) || 0,
            }
          : previous.stats,
      }));
      setReviewForm({ rating: '5', headline: '', comment: '' });
      setReviewSubmitState({ isSubmitting: false, type: 'success', message: 'Review saved. Thank you for your feedback.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your review.';
      setReviewSubmitState({ isSubmitting: false, type: 'error', message });
    }
  };

  const handlePrimaryAction = useCallback(() => {
    if (hasMembershipOption && purchaseOption === 'membership') {
      onOpenSubscription(product.id);
      return;
    }
    handleAddToCart();
  }, [handleAddToCart, hasMembershipOption, onOpenSubscription, product.id, purchaseOption]);

  const renderQuantitySelector = ({ compact = false, idPrefix = 'qty' } = {}) => (
    <div className={`inline-flex items-center border border-gray-700 ${compact ? 'h-11' : 'h-12'}`}>
      <button
        type="button"
        onClick={() => incrementQty(-1)}
        className={`px-4 text-[#F9F6F0] hover:bg-[#1a1a1a] transition-colors ${compact ? 'text-base' : 'text-lg'}`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <label htmlFor={`${idPrefix}-${product.id}`} className="sr-only">Quantity</label>
      <input
        id={`${idPrefix}-${product.id}`}
        type="text"
        inputMode="numeric"
        value={qty}
        onChange={(event) => {
          const sanitized = event.target.value.replace(/[^\d]/g, '');
          if (!sanitized) {
            setQty(1);
            return;
          }
          setQty(clampQty(Number(sanitized)));
        }}
        className={`w-12 bg-transparent text-center text-[#F9F6F0] outline-none ${compact ? 'text-sm' : 'text-base'}`}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => incrementQty(1)}
        className={`px-4 text-[#F9F6F0] hover:bg-[#1a1a1a] transition-colors ${compact ? 'text-base' : 'text-lg'}`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  return (
    <div
      ref={pdpRootRef}
      className="bg-[#0B0C0C] min-h-screen pt-28 md:pt-32 pb-[var(--pdp-mobile-bottom-space,6rem)] md:pb-24 text-[#F9F6F0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button onClick={onBack} className="flex items-center text-[#D4AF37] mb-8 hover:text-[#F9F6F0] transition-colors font-sans text-sm tracking-widest uppercase">
          <ArrowLeft size={16} className="mr-2" /> Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Section */}
          <div className="flex flex-col gap-6">
            <div
              className="w-full aspect-[4/5] bg-[#1a1a1a] relative overflow-hidden touch-pan-y"
              onTouchStart={handleMainImageTouchStart}
              onTouchEnd={handleMainImageTouchEnd}
            >
              <img src={mainImage} alt={`${product.name} detail image`} className="w-full h-full object-cover" decoding="async" />
              {product.images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/55 px-2.5 py-1 text-[10px] tracking-widest uppercase text-[#F9F6F0]">
                  {mainImageIndex + 1}/{product.images.length}
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  type="button"
                  key={idx} 
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${mainImageIndex === idx ? 'border-[#D4AF37]' : 'border-transparent'} hover:border-[#D4AF37]`}
                  onClick={() => setMainImageIndex(idx)}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:sticky lg:top-28 self-start">
            <span className="text-[#D4AF37] font-sans tracking-[0.2em] text-xs uppercase mb-2 block">{categoryLabel}</span>
            {prominentOrigin && (
              <p className="text-sm uppercase tracking-[0.24em] text-gray-500 mb-3">{prominentOrigin}</p>
            )}
            <h1 className="text-4xl md:text-6xl font-serif text-[#F9F6F0] mb-4">{product.name}</h1>
            <p className="text-lg md:text-xl text-gray-400 font-sans mb-4">{product.subtitle}</p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-1 text-[#D4AF37]" aria-label={`${reviewsState.stats.count} reviews`}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const isFilled = index < Math.round(reviewsState.stats.averageRating || 0);
                  return <Star key={index} size={14} fill={isFilled ? 'currentColor' : 'none'} className={isFilled ? '' : 'text-gray-600'} />;
                })}
              </div>
              <p className="text-sm text-gray-400">
                {reviewsState.stats.count > 0
                  ? `${reviewsState.stats.averageRating.toFixed(1)} • ${reviewsState.stats.count} review${reviewsState.stats.count === 1 ? '' : 's'}`
                  : '0 reviews'}
              </p>
            </div>
            <div className="flex flex-col gap-2 mb-4 border-b border-gray-800 pb-6">
              <span className="text-3xl font-serif text-[#D4AF37]">
                ${((hasMembershipOption && purchaseOption === 'membership') ? membershipPrice : product.price).toFixed(2)}
              </span>
              {hasMembershipOption && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setPurchaseOption('one-time')}
                      className={`w-full text-left border px-4 py-4 transition-colors ${purchaseOption === 'one-time' ? 'border-gray-500 bg-[#141414]' : 'border-gray-800 hover:border-gray-600'}`}
                      aria-pressed={purchaseOption === 'one-time'}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-serif text-2xl text-[#F9F6F0]">One-time purchase</p>
                          <p className="text-sm text-gray-400 mt-1">A single delivery for the current ritual.</p>
                        </div>
                        <p className="text-lg text-[#F9F6F0]">${product.price.toFixed(2)}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseOption('membership')}
                      className={`w-full text-left border px-4 py-4 transition-colors ${purchaseOption === 'membership' ? 'border-[#D4AF37] bg-[#14110a] shadow-[0_0_0_1px_rgba(212,175,55,0.18)]' : 'border-[#D4AF37]/30 hover:border-[#D4AF37]/55'}`}
                      aria-pressed={purchaseOption === 'membership'}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-serif text-2xl text-[#F9F6F0]">Ritual Membership</p>
                          <p className="text-sm text-gray-400 mt-1">Cancel anytime. Ships every 4 weeks.</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-lg text-[#D4AF37]">${membershipPrice.toFixed(2)}</p>
                            <span className="border border-[#D4AF37]/45 bg-[#1a1408] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                              Save 15%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="flex items-center gap-2 text-xs text-gray-400 mb-6">
              <Check size={14} className="text-[#D4AF37]" />
              Free shipping over $50
            </p>

            {functionalIngredients.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {functionalIngredients.map((ingredient) => (
                  <div key={ingredient.name} className="flex min-w-[220px] flex-1 items-center gap-3 border border-[#D4AF37]/25 bg-[#141414] px-4 py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#1a1a1a]">
                      {ingredient.name === 'Lion’s Mane' ? <Leaf size={18} className="text-[#D4AF37]" /> : null}
                      {ingredient.name === 'Chaga' ? <Award size={18} className="text-[#D4AF37]" /> : null}
                      {ingredient.name === 'Cordyceps' ? <Coffee size={18} className="text-[#D4AF37]" /> : null}
                      {ingredient.name === 'Hemp Protein' ? <Leaf size={18} className="text-[#D4AF37]" /> : null}
                    </div>
                    <div>
                      <p className="font-serif text-xl text-[#F9F6F0]">{ingredient.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{ingredient.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="hidden md:block mb-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-xs uppercase tracking-widest text-gray-400">Quantity</p>
                {renderQuantitySelector({ idPrefix: 'desktop-qty' })}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setQuickQty(2)}
                  className={`border py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider transition-colors ${qty === 2 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-[#F9F6F0] hover:border-[#D4AF37]'}`}
                  aria-pressed={qty === 2}
                >
                  Buy 2
                </button>
                <button
                  type="button"
                  onClick={() => setQuickQty(3)}
                  className={`border py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider transition-colors ${qty === 3 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-[#F9F6F0] hover:border-[#D4AF37]'}`}
                  aria-pressed={qty === 3}
                >
                  Buy 3
                </button>
              </div>
              <button
                onClick={handlePrimaryAction}
                disabled={isBundleProduct && !isBundleSelectionComplete}
                className={`w-full bg-[#D4AF37] text-[#0B0C0C] py-4 font-sans font-bold tracking-widest uppercase transition-colors ${(isBundleProduct && !isBundleSelectionComplete) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
              >
                {(isBundleProduct && !isBundleSelectionComplete)
                  ? 'Select Bundle Items'
                  : (hasMembershipOption && purchaseOption === 'membership')
                    ? `Begin Ritual Membership — $${(membershipPrice * qty).toFixed(2)}`
                    : `Add to Cart — $${(product.price * qty).toFixed(2)}`}
              </button>
            </div>

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

            <p className="text-gray-300 font-sans leading-relaxed mb-8 whitespace-pre-line">
              {product.description}
            </p>

            {hasMembershipOption && (
              <section className="border border-[#D4AF37]/35 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(11,12,12,0.96))] p-6 mb-8">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#D4AF37] mb-2">Founding Member</p>
                <h3 className="font-serif text-3xl text-[#F9F6F0] mb-3">Be one of the first 50.</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Get your first Ritual Membership bag at {foundingMemberPercent}% off and lock in that price forever.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#D4AF37]/20 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500">Founding Member rate</p>
                    <p className="font-serif text-3xl text-[#D4AF37]">${foundingMemberPrice.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSubscription(product.id)}
                    className="border border-[#D4AF37] text-[#D4AF37] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-colors"
                  >
                    Claim Founding Rate
                  </button>
                </div>
              </section>
            )}

            {isBundleProduct && (
              <div className="bg-[#151515] p-6 mb-8 border border-gray-800">
                <h3 className="font-serif text-[#D4AF37] mb-4">What&apos;s Inside</h3>
                {Array.isArray(product.bundleContents) && product.bundleContents.length > 0 && (
                  <ul className="space-y-2 text-sm text-gray-300 font-sans list-disc pl-5 mb-5">
                    {product.bundleContents.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}

                {bundleSlots.length > 0 && (
                  <div className="space-y-4">
                    {bundleSlots.map((slot) => {
                      const selectedProduct = slot.options.find((option) => option.id === bundleSelections[slot.key]);
                      return (
                        <div key={slot.key} className="grid grid-cols-[4.5rem,1fr] gap-4 items-center border border-gray-800 p-3">
                          <button
                            type="button"
                            onClick={() => selectedProduct && setBundlePreviewProduct(selectedProduct)}
                            className="w-[4.5rem] h-[4.5rem] bg-[#0B0C0C] border border-gray-700 overflow-hidden disabled:cursor-default"
                            disabled={!selectedProduct}
                            aria-label={selectedProduct ? `Preview ${selectedProduct.name}` : `${slot.label} preview unavailable`}
                          >
                            {selectedProduct ? (
                              <img
                                src={selectedProduct.images?.[0] || DEFAULT_SHARE_IMAGE_URL}
                                alt={`${selectedProduct.name} bundle selection`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                          </button>
                          <div>
                            <label htmlFor={`${product.id}-${slot.key}`} className="block text-xs uppercase tracking-wider text-gray-400 mb-1">
                              {slot.label}
                            </label>
                            <select
                              id={`${product.id}-${slot.key}`}
                              value={bundleSelections[slot.key] || ''}
                              onChange={(event) => setBundleSelections((previous) => ({ ...previous, [slot.key]: event.target.value }))}
                              className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                            >
                              {slot.options.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.name} — {option.subtitle}
                                </option>
                              ))}
                            </select>
                            {slot.helper && (
                              <p className="mt-1 text-[11px] text-gray-500">{slot.helper}</p>
                            )}
                            {selectedProduct && (
                              <button
                                type="button"
                                onClick={() => setBundlePreviewProduct(selectedProduct)}
                                className="mt-2 text-[11px] uppercase tracking-wider text-[#D4AF37] hover:text-[#F9F6F0] transition-colors"
                              >
                                Preview {selectedProduct.name}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isBundleSelectionComplete && (
                  <p className="text-xs text-[#D4AF37] mt-4 uppercase tracking-wider">
                    Select each slot to continue.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <section className="border border-gray-800 bg-[#151515]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('details')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  aria-expanded={isDetailsOpen}
                  aria-controls={detailsPanelId}
                >
                  <span className="font-serif text-[#D4AF37]">The Details</span>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">{isDetailsOpen ? 'Hide' : 'Show'}</span>
                </button>
                <div
                  id={detailsPanelId}
                  className={`motion-accordion-panel ${isDetailsOpen ? 'is-open' : ''}`}
                  aria-hidden={!isDetailsOpen}
                  inert={!isDetailsOpen ? '' : undefined}
                >
                  <div className="px-5 pb-5 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr,260px] gap-5 items-start">
                      <div>
                        <ul className="space-y-3 text-sm text-gray-400 font-sans">
                          {detailsRows.map((row) => (
                            <li key={row.label} className="flex justify-between border-b border-gray-800 pb-2 gap-4">
                              <span>{row.label}</span>
                              <span className="text-[#F9F6F0] text-right">{row.value}</span>
                            </li>
                          ))}
                          <li className="pt-2">
                            <span className="block mb-1 text-gray-400">Ingredients</span>
                            <span className="text-[#F9F6F0] leading-snug">{product.details.ingredients}</span>
                          </li>
                          {suggestedUseValue && (
                            <li className="pt-2">
                              <span className="block mb-1 text-gray-400">Suggested Use</span>
                              <span className="text-[#F9F6F0] leading-snug">{suggestedUseValue}</span>
                            </li>
                          )}
                        </ul>
                        {nutritionRows.length > 0 && (
                          <ul className="space-y-2 text-sm text-gray-300 font-sans mt-5">
                            {nutritionRows.map((row) => (
                              <li key={row.label} className="flex justify-between border-b border-gray-800 pb-2 gap-3">
                                <span>{row.label}</span>
                                <span className="text-[#F9F6F0] text-right">{row.value}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="border border-gray-800 p-3 bg-[#111111]">
                        <span className="block mb-2 text-xs uppercase tracking-widest text-[#D4AF37]">Velure Standards</span>
                        <div className="flex flex-wrap gap-2">
                          {productClaims.map((claim) => (
                            <span key={claim} className="px-2 py-1 border border-gray-700 text-xs text-[#F9F6F0]">
                              {claim}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Nutrition values are shown from verified product specifications and label data.
                    </p>
                  </div>
                </div>
              </section>

              <section className="border border-gray-800 bg-[#151515]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  aria-expanded={isShippingOpen}
                  aria-controls={shippingPanelId}
                >
                  <span className="font-serif text-[#D4AF37]">Shipping &amp; Returns</span>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">{isShippingOpen ? 'Hide' : 'Show'}</span>
                </button>
                <div
                  id={shippingPanelId}
                  className={`motion-accordion-panel ${isShippingOpen ? 'is-open' : ''}`}
                  aria-hidden={!isShippingOpen}
                  inert={!isShippingOpen ? '' : undefined}
                >
                  <div className="px-5 pb-5 pt-1">
                    <ul className="space-y-2 text-sm text-gray-300 font-sans">
                      <li className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> Free shipping on orders over $50.</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> Standard domestic delivery is typically 2-5 business days.</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> 30-day return window on unopened products.</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-[#D4AF37]" /> Secure checkout processing on all orders.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="border border-gray-800 bg-[#151515]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('reviews')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                  aria-expanded={isReviewsOpen}
                  aria-controls={reviewsPanelId}
                >
                  <span className="font-serif text-[#D4AF37]">Reviews</span>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">{isReviewsOpen ? 'Hide' : 'Show'}</span>
                </button>
                <div
                  id={reviewsPanelId}
                  className={`motion-accordion-panel ${isReviewsOpen ? 'is-open' : ''}`}
                  aria-hidden={!isReviewsOpen}
                  inert={!isReviewsOpen ? '' : undefined}
                >
                  <div className="px-5 pb-5 pt-1">
                    {reviewsState.isLoading ? (
                      <p className="text-sm text-gray-400">Loading reviews...</p>
                    ) : reviewsState.error ? (
                      <p className="text-sm text-red-400">{reviewsState.error}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-4">
                          {reviewsState.stats.count > 0
                            ? `${reviewsState.stats.averageRating.toFixed(1)} / 5 (${reviewsState.stats.count} review${reviewsState.stats.count > 1 ? 's' : ''})`
                            : 'Be the first to review this ritual.'}
                        </p>

                        {reviewsState.items.length > 0 && (
                          <div className="space-y-4 mb-6">
                            {reviewsState.items.map((review) => (
                              <article key={review.id} className="border border-gray-700 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-[#F9F6F0]">{review.displayName || 'Verified Customer'}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-xs text-[#D4AF37] mt-2">{'★'.repeat(Math.max(1, Math.min(5, Number(review.rating) || 0)))}</p>
                                {review.headline ? <p className="text-sm text-[#F9F6F0] mt-2">{review.headline}</p> : null}
                                <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        {reviewsState.items.length === 0 && (
                          <div className="border border-gray-700 bg-[#111111] p-4 mb-6">
                            <div className="flex items-center gap-1 text-[#D4AF37] mb-3" aria-hidden="true">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star key={index} size={14} />
                              ))}
                            </div>
                            <p className="text-sm text-[#F9F6F0]">Be the first to review</p>
                            <p className="text-sm text-gray-400 mt-2">
                              Share how this ritual tastes, how it fits your morning, and what you notice in the cup once your order arrives.
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {!authUser ? (
                      <div className="mt-5">
                        <p className="text-sm text-gray-400 mb-3">Sign in and complete a purchase to leave a review.</p>
                        <button
                          type="button"
                          onClick={onOpenAccount}
                          className="border border-[#D4AF37] text-[#D4AF37] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
                        >
                          Sign In
                        </button>
                      </div>
                    ) : reviewsState.canReview ? (
                      <form onSubmit={handleReviewSubmit} className="mt-5 space-y-3" noValidate>
                        <label className="block text-xs uppercase tracking-widest text-gray-400" htmlFor={`review-rating-${product.id}`}>
                          Rating
                        </label>
                        <select
                          id={`review-rating-${product.id}`}
                          value={reviewForm.rating}
                          onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
                          className="w-full border border-gray-700 bg-[#0B0C0C] p-3 text-sm outline-none focus:border-[#D4AF37]"
                        >
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Great</option>
                          <option value="3">3 - Good</option>
                          <option value="2">2 - Fair</option>
                          <option value="1">1 - Poor</option>
                        </select>
                        <input
                          type="text"
                          value={reviewForm.headline}
                          onChange={(event) => setReviewForm((prev) => ({ ...prev, headline: event.target.value }))}
                          placeholder="Headline (optional)"
                          className="w-full border border-gray-700 bg-[#0B0C0C] p-3 text-sm outline-none focus:border-[#D4AF37]"
                        />
                        <textarea
                          value={reviewForm.comment}
                          onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                          placeholder="Share your experience (min 8 characters)"
                          rows={4}
                          className="w-full border border-gray-700 bg-[#0B0C0C] p-3 text-sm outline-none focus:border-[#D4AF37]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={reviewSubmitState.isSubmitting}
                          className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider ${reviewSubmitState.isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                        >
                          {reviewSubmitState.isSubmitting ? 'Saving...' : 'Submit Review'}
                        </button>
                        {reviewSubmitState.message && (
                          <p className={`text-sm ${reviewSubmitState.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                            {reviewSubmitState.message}
                          </p>
                        )}
                      </form>
                    ) : (
                      <p className="text-sm text-gray-400 mt-5">{reviewsState.reason || 'Only verified customers can leave a review.'}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {bundlePreviewProduct && (
        <div className="fixed inset-0 z-[70] bg-black/70 px-4 py-10 md:py-16 overflow-y-auto motion-modal-overlay" role="dialog" aria-modal="true" aria-label={`${bundlePreviewProduct.name} preview`}>
          <div className="max-w-2xl mx-auto border border-gray-700 bg-[#0B0C0C] motion-modal-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <p className="text-xs uppercase tracking-widest text-[#D4AF37]">Bundle Preview</p>
              <button
                type="button"
                onClick={() => setBundlePreviewProduct(null)}
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-[#F9F6F0]"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[220px,1fr] gap-5 p-5">
              <div className="aspect-square bg-[#151515] border border-gray-800 overflow-hidden">
                <img
                  src={bundlePreviewProduct.images?.[0] || DEFAULT_SHARE_IMAGE_URL}
                  alt={`${bundlePreviewProduct.name} preview`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <h4 className="font-serif text-3xl text-[#F9F6F0]">{bundlePreviewProduct.name}</h4>
                <p className="text-sm text-gray-400 mt-1">{bundlePreviewProduct.subtitle}</p>
                <p className="text-lg text-[#D4AF37] mt-3">${bundlePreviewProduct.price.toFixed(2)}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  <li><span className="text-gray-500">Origin:</span> {bundlePreviewProduct.details.origin}</li>
                  {bundlePreviewProduct.details.roast && <li><span className="text-gray-500">Roast:</span> {bundlePreviewProduct.details.roast}</li>}
                  <li><span className="text-gray-500">Weight:</span> {bundlePreviewProduct.details.weight}</li>
                </ul>
                <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                  {bundlePreviewProduct.description.split('\n')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCartOpen && (
      <>
      <div
        ref={mobileStickyBarRef}
        className="fixed md:hidden bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-[#0B0C0C]/95 backdrop-blur-sm px-4 pt-3 pb-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <div className="max-w-7xl mx-auto space-y-3">
          {hasMembershipOption && (
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseOption('one-time')}
                  className={`h-11 border text-[11px] font-bold uppercase tracking-wider ${purchaseOption === 'one-time' ? 'border-gray-500 text-[#F9F6F0]' : 'border-gray-800 text-gray-400'}`}
                  aria-pressed={purchaseOption === 'one-time'}
                >
                  One-time
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseOption('membership')}
                  className={`h-11 border text-[11px] font-bold uppercase tracking-wider ${purchaseOption === 'membership' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#14110a]' : 'border-[#D4AF37]/30 text-gray-300'}`}
                  aria-pressed={purchaseOption === 'membership'}
                >
                  Ritual Membership
                </button>
              </div>
              {purchaseOption === 'membership' && (
                <p className="mt-2 text-[11px] text-gray-400">Cancel anytime. Ships every 4 weeks.</p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-400 uppercase tracking-wider truncate">{product.name}</p>
              <p className="text-lg font-serif text-[#D4AF37]">
                ${((hasMembershipOption && purchaseOption === 'membership') ? membershipPrice : product.price).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handlePrimaryAction}
              disabled={isBundleProduct && !isBundleSelectionComplete}
              className={`bg-[#D4AF37] text-[#0B0C0C] px-4 py-3 text-sm font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${(isBundleProduct && !isBundleSelectionComplete) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
            >
              {(isBundleProduct && !isBundleSelectionComplete)
                ? 'Select Items'
                : (hasMembershipOption && purchaseOption === 'membership')
                  ? 'Begin Membership'
                  : 'Add to Cart'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {renderQuantitySelector({ compact: true, idPrefix: 'mobile-qty' })}
            <button
              type="button"
              onClick={() => setQuickQty(2)}
              className={`h-11 px-3 border text-xs font-bold uppercase tracking-wider ${qty === 2 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-[#F9F6F0]'}`}
              aria-pressed={qty === 2}
            >
              Buy 2
            </button>
            <button
              type="button"
              onClick={() => setQuickQty(3)}
              className={`h-11 px-3 border text-xs font-bold uppercase tracking-wider ${qty === 3 ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-[#F9F6F0]'}`}
              aria-pressed={qty === 3}
            >
              Buy 3
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

const AuthModal = ({
  isOpen,
  onClose,
  onPasswordSignIn,
  onMagicLinkSignIn,
  onSignUp,
  onForgotPassword,
}) => {
  const [mode, setMode] = useState('signin');
  const [signInMethod, setSignInMethod] = useState('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setStatus({ type: 'idle', message: '' });
  };
  const handleSignInMethodChange = (nextMethod) => {
    setSignInMethod(nextMethod);
    setStatus({ type: 'idle', message: '' });
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = normalizeLower(email);

    if (!isValidEmail(normalizedEmail)) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    if (mode === 'signin' && signInMethod === 'password' && password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setStatus({ type: 'error', message: 'Password confirmation does not match.' });
        return;
      }
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    let result = { ok: false, message: 'Unable to complete your request.' };
    if (mode === 'signin' && signInMethod === 'magic') {
      result = await onMagicLinkSignIn(normalizedEmail);
    } else if (mode === 'signin') {
      result = await onPasswordSignIn(normalizedEmail, password);
    } else if (mode === 'signup') {
      result = await onSignUp(normalizedEmail, password);
    } else {
      result = await onForgotPassword(normalizedEmail);
    }

    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/70 px-4 py-6 sm:p-6 motion-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center">
        <div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#151515] border border-gray-800 rounded-2xl sm:rounded-sm p-6 sm:p-8 shadow-2xl motion-modal-panel"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-[11px] tracking-[0.24em] uppercase text-gray-400">Velure Account</p>
              <h2 id="auth-modal-title" className="font-serif text-3xl text-[#F9F6F0] mt-1">
                {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 inline-flex items-center justify-center border border-gray-700 text-gray-300 hover:text-[#F9F6F0] hover:border-gray-500"
              aria-label="Close account dialog"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider border ${mode === 'signin' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider border ${mode === 'signup' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('forgot')}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider border ${mode === 'forgot' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
            >
              Forgot
            </button>
          </div>

          {mode === 'signin' && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => handleSignInMethodChange('magic')}
                className={`py-2 text-[11px] font-bold uppercase tracking-wider border ${signInMethod === 'magic' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
                aria-pressed={signInMethod === 'magic'}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => handleSignInMethodChange('password')}
                className={`py-2 text-[11px] font-bold uppercase tracking-wider border ${signInMethod === 'password' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-gray-700 text-gray-400 hover:text-[#F9F6F0]'}`}
                aria-pressed={signInMethod === 'password'}
              >
                Password
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
              />
              {((mode === 'signin' && signInMethod === 'password') || mode === 'signup') && (
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'Password (min 8 chars)' : 'Password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
              )}
              {mode === 'signup' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-5 w-full bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
            >
              {isSubmitting
                ? 'Please wait...'
                : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                    ? 'Send Reset Link'
                    : signInMethod === 'magic'
                      ? 'Send Magic Link'
                      : 'Sign In'}
            </button>
          </form>

          {status.message && (
            <p className={`text-sm mt-4 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
              {status.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Guest checkout remains available with no account required.
          </p>
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ currentView, cartCount, setView, toggleCart, authUser, onSignOut, onSharePage, onOpenAuthModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuToggleRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    const focusableElements = mobileMenuRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    if (firstFocusable instanceof HTMLElement) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
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

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [mobileMenuOpen]);

  const handleCloseMobileMenu = () => setMobileMenuOpen(false);
  const handleNav = (viewName) => {
    setView(viewName);
    handleCloseMobileMenu();
    setAccountMenuOpen(false);
  };

  const handleShare = async () => {
    if (typeof onSharePage === 'function') {
      await onSharePage();
    }
    handleCloseMobileMenu();
    setAccountMenuOpen(false);
  };

  const handleAccountAction = () => {
    if (authUser) {
      setAccountMenuOpen((previous) => !previous);
      return;
    }

    if (typeof onOpenAuthModal === 'function') {
      onOpenAuthModal();
    }
    handleCloseMobileMenu();
    setAccountMenuOpen(false);
  };

  const handleAccountMenuSignOut = () => {
    setAccountMenuOpen(false);
    onSignOut();
  };

  const isTransparent = currentView === 'home' && !isScrolled;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent py-6' : 'bg-[#0B0C0C] shadow-lg py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <button
          type="button"
          ref={mobileMenuToggleRef}
          className="md:hidden text-[#F9F6F0] h-11 w-11 inline-flex items-center justify-center rounded-sm"
          onClick={() => setMobileMenuOpen((previous) => !previous)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-haspopup="dialog"
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
          <button onClick={() => handleNav('shop_bundles')} className="hover:text-[#D4AF37] transition-colors uppercase">Bundles</button>
          <button onClick={() => handleNav('blog')} className="hover:text-[#D4AF37] transition-colors uppercase">Journal</button>
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

          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              className="text-[#F9F6F0] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
              onClick={handleAccountAction}
              aria-label={authUser ? 'Open account menu' : 'Log in or sign up'}
              aria-haspopup={authUser ? 'menu' : undefined}
              aria-expanded={authUser ? accountMenuOpen : undefined}
            >
              <User size={20} />
              <span className="hidden md:inline text-xs uppercase tracking-widest">
                {authUser ? 'Account' : 'Login'}
              </span>
            </button>

            {authUser && accountMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 bg-[#151515] border border-gray-800 shadow-2xl z-50"
                role="menu"
                aria-label="Account actions"
              >
                <button
                  type="button"
                  onClick={() => handleNav('account')}
                  className="w-full text-left px-4 py-3 text-xs uppercase tracking-wider text-[#F9F6F0] hover:bg-[#1C1C1C]"
                  role="menuitem"
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={handleAccountMenuSignOut}
                  className="w-full text-left px-4 py-3 text-xs uppercase tracking-wider text-[#D4AF37] hover:bg-[#1C1C1C]"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

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

	      <div
	        className={`fixed inset-0 z-[70] md:hidden ${mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
	        aria-hidden={!mobileMenuOpen}
	      >
	        <button
	          type="button"
	          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
	          onClick={handleCloseMobileMenu}
	          aria-label="Close navigation menu"
	        />
	        <aside
	          id="mobile-navigation"
	          ref={mobileMenuRef}
	          role="dialog"
	          aria-modal="true"
	          aria-label="Mobile navigation"
	          className={`absolute top-0 left-0 h-full w-[min(88vw,22rem)] bg-[#0B0C0C] border-r border-gray-800 shadow-2xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
	          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
	        >
	          <div className="h-full overflow-y-auto pt-8 px-5 pb-4">
	            <div className="flex items-center justify-between mb-6">
	              <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">Menu</p>
	              <button
	                type="button"
	                onClick={handleCloseMobileMenu}
	                className="h-11 w-11 inline-flex items-center justify-center border border-gray-700 text-gray-300 hover:text-[#F9F6F0] hover:border-gray-500"
	                aria-label="Close menu"
	              >
	                <X size={20} />
	              </button>
	            </div>

	            <div className="space-y-7">
	              <div>
	                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Shop</p>
	                <div className="space-y-1">
	                  <button type="button" onClick={() => handleNav('shop_all')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">All Coffee</button>
	                  <button type="button" onClick={() => handleNav('shop_functional')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Functional Blends</button>
	                  <button type="button" onClick={() => handleNav('shop_signature')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Signature Blends</button>
	                  <button type="button" onClick={() => handleNav('shop_single_origin')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Single Origin</button>
	                  <button type="button" onClick={() => handleNav('shop_bundles')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Bundles</button>
	                </div>
	              </div>

	              <div>
	                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Content</p>
	                <div className="space-y-1">
	                  <button type="button" onClick={() => handleNav('blog')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Journal</button>
	                  <button type="button" onClick={() => handleNav('about')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Our Story</button>
	                  <button type="button" onClick={() => handleNav('sourcing')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Sourcing</button>
	                </div>
	              </div>

	              <div>
	                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Account</p>
	                <div className="space-y-1">
	                  <button type="button" onClick={() => handleNav('rewards')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Rewards</button>
	                  <button type="button" onClick={() => handleNav('subscription')} className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]">Subscription</button>
	                  <button
	                    type="button"
	                    onClick={() => {
	                      if (authUser) {
	                        handleNav('account');
	                        return;
	                      }
	                      if (typeof onOpenAuthModal === 'function') {
	                        onOpenAuthModal();
	                      }
	                      handleCloseMobileMenu();
	                    }}
	                    className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#F9F6F0] hover:text-[#D4AF37]"
	                  >
	                    Account
	                  </button>
	                  {authUser && (
	                    <button
	                      type="button"
	                      onClick={() => {
	                        handleCloseMobileMenu();
	                        onSignOut();
	                      }}
	                      className="w-full min-h-[44px] text-left text-sm tracking-wider text-[#D4AF37] hover:text-[#F9F6F0]"
	                    >
	                      Sign Out
	                    </button>
	                  )}
	                </div>
	              </div>
	            </div>

	            <div className="mt-8 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500">
	              <button type="button" onClick={() => handleNav('contact')} className="min-h-[44px] hover:text-[#F9F6F0]">
	                Contact
	              </button>
	              <button type="button" onClick={() => handleNav('privacy')} className="min-h-[44px] hover:text-[#F9F6F0]">
	                Privacy
	              </button>
	              <button type="button" onClick={() => handleNav('terms')} className="min-h-[44px] hover:text-[#F9F6F0]">
	                Terms
	              </button>
	            </div>
	          </div>
	        </aside>
	      </div>
	    </nav>
	  );
};

const CartDrawer = ({
  isOpen,
  closeCart,
  cart,
  removeFromCart,
  decrementCartItemQty,
  incrementCartItemQty,
  setCartItemQty,
  clearCart,
  rewardsProfile,
  authUser,
  onOpenAuthModal,
  onRedeemReward,
  onRemoveReward,
  onProceedToCheckout,
}) => {
  const drawerRef = useRef(null);
  const cartDisplayItems = useMemo(() => getCartDisplayItems(cart), [cart]);
  const subtotal = useMemo(() => getCartSubtotal(cart), [cart]);
  const cartTotalQty = useMemo(() => getCartTotalQuantity(cart), [cart]);
  const activeRewardId = authUser ? rewardsProfile.activeRewardId : null;
  const pricing = getCheckoutPricing(subtotal, activeRewardId);
  const activeReward = getRewardOffer(activeRewardId);
  const amountToFreeShipping = Math.max(0, Number((FREE_SHIPPING_THRESHOLD - pricing.subtotal).toFixed(2)));
  const [rewardStatus, setRewardStatus] = useState({ type: 'idle', message: '' });
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isRewardsExpanded, setIsRewardsExpanded] = useState(false);
  const handleCloseCart = useCallback(() => {
    setIsOrderDetailsOpen(false);
    setIsRewardsExpanded(false);
    closeCart();
  }, [closeCart]);

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
        handleCloseCart();
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
  }, [handleCloseCart, isOpen]);

  const handleCheckout = () => {
    if (cartDisplayItems.length === 0) return;
    setIsOrderDetailsOpen(false);
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
    <div className={`fixed inset-0 z-[60] flex justify-end motion-overlay ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <button type="button" className={`absolute inset-0 bg-black/50 motion-backdrop ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseCart} aria-label="Close cart drawer" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`relative w-full max-w-lg bg-[#0B0C0C] h-[100svh] shadow-2xl flex flex-col motion-drawer-panel ${isOpen ? 'motion-drawer-panel-open' : 'motion-drawer-panel-closed'}`}
      >
        <div className="px-4 py-3 border-b border-white/10 text-[#F9F6F0]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="cart-drawer-title" className="font-serif text-[1.45rem] leading-none tracking-wide">Your Ritual</h2>
              <p className="text-[11px] text-gray-400 mt-1.5">{cartTotalQty} unit{cartTotalQty === 1 ? '' : 's'}</p>
              {cartDisplayItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="mt-1.5 text-[10px] tracking-wide text-gray-400 hover:text-[#D4AF37]"
                >
                  Clear cart
                </button>
              )}
            </div>
            <button type="button" onClick={handleCloseCart} aria-label="Close cart" className="h-10 w-10 inline-flex items-center justify-center border border-gray-700 text-gray-300 hover:text-[#F9F6F0] hover:border-gray-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {cartDisplayItems.length === 0 ? (
            <div className="text-center border border-white/10 bg-[#111212] p-8 mt-4">
              <p className="text-[#F9F6F0] font-serif text-2xl">Cart is empty</p>
              <p className="text-sm text-gray-400 mt-2">Add coffee products to begin your checkout.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {cartDisplayItems.map((item) => {
                const bundleSelectionSlots = Array.isArray(item.bundleSelection?.slots) ? item.bundleSelection.slots : [];
                const canDecreaseQty = item.quantity > 1;
                const canIncreaseQty = item.quantity < 10;
                return (
                  <article key={item.productId} className="py-3.5">
                    <div className="flex gap-3">
                      <div className="h-[72px] w-[72px] shrink-0 border border-white/10 overflow-hidden bg-[#101111]">
                        {bundleSelectionSlots.length >= 2 ? (
                          <div className="grid grid-cols-2 gap-px h-full bg-gray-700">
                            {bundleSelectionSlots.slice(0, 2).map((slot) => (
                              <img
                                key={`${item.productId}-${slot.slotKey}-${slot.productId}`}
                                src={slot.image || DEFAULT_SHARE_IMAGE_URL}
                                alt={`${slot.name} in ${item.name}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ))}
                          </div>
                        ) : (
                          <img
                            src={item.images?.[0] || DEFAULT_SHARE_IMAGE_URL}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-serif text-lg text-[#F9F6F0] truncate">{item.name}</p>
                            <p className="text-[11px] uppercase tracking-wider text-gray-400 truncate">{item.subtitle}</p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {item.details?.roast ? `${item.details.roast} roast` : item.category === 'bundles' ? 'Bundle set' : 'Coffee'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-xs uppercase tracking-wider text-gray-500 hover:text-[#F9F6F0]"
                          >
                            Remove
                          </button>
                        </div>

                        {bundleSelectionSlots.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {bundleSelectionSlots.map((slot) => (
                              <li key={`${slot.slotKey}-${slot.productId}`} className="text-[11px] text-gray-500">
                                {slot.slotLabel}: {slot.name}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center border border-[#D4AF37]/50 bg-[#0B0C0C]">
                            <button
                              type="button"
                              onClick={() => decrementCartItemQty(item.productId)}
                              disabled={!canDecreaseQty}
                              aria-disabled={!canDecreaseQty}
                              className={`h-9 w-9 text-[#D4AF37] ${canDecreaseQty ? 'hover:bg-[#D4AF37]/10' : 'opacity-40 cursor-not-allowed'}`}
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={item.quantity}
                              onChange={(event) => setCartItemQty(item.productId, Number(event.target.value))}
                              className="h-9 w-12 bg-transparent text-center text-sm text-[#F9F6F0] border-x border-[#D4AF37]/30 outline-none"
                              aria-label={`Set quantity for ${item.name}`}
                            />
                            <button
                              type="button"
                              onClick={() => incrementCartItemQty(item.productId)}
                              disabled={!canIncreaseQty}
                              aria-disabled={!canIncreaseQty}
                              className={`h-9 w-9 text-[#D4AF37] ${canIncreaseQty ? 'hover:bg-[#D4AF37]/10' : 'opacity-40 cursor-not-allowed'}`}
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] text-gray-400">${item.price.toFixed(2)} each</p>
                            <p className="text-sm font-semibold text-[#F9F6F0]">${item.lineTotal.toFixed(2)}</p>
                            <p className="text-[11px] text-[#D4AF37]">×{item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 shrink-0 relative px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-[#0B0C0C]/95 backdrop-blur border-t border-white/10">
          <div aria-hidden="true" className="pointer-events-none absolute -top-5 left-0 right-0 h-5 bg-gradient-to-t from-[#0B0C0C]/45 to-transparent" />
          <div className="flex items-center justify-between gap-3">
            {!authUser ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof onOpenAuthModal === 'function') {
                    onOpenAuthModal();
                  }
                }}
                className="flex-1 min-w-0 truncate text-left text-[11px] text-[#D4AF37] hover:text-[#F9F6F0]"
              >
                Sign in for rewards
              </button>
            ) : (
              <span className="flex-1 min-w-0 truncate text-[11px] text-gray-500">
                {activeReward ? `Reward applied: ${activeReward.name}` : `${rewardsProfile.points} pts available`}
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsOrderDetailsOpen((previous) => !previous)}
              className="shrink-0 inline-flex items-center gap-2 text-[11px] text-gray-400 hover:text-[#D4AF37]"
              aria-expanded={isOrderDetailsOpen}
            >
              Order details
              <ChevronDown size={14} className={`transition-transform ${isOrderDetailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className={`motion-accordion-panel ${isOrderDetailsOpen ? 'is-open' : ''}`}>
            <div className="mt-2 max-h-44 overflow-y-auto border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Subtotal</span>
                <span className="text-sm font-semibold text-[#F9F6F0]">${pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Shipping</span>
                <span className="text-sm font-semibold text-[#F9F6F0]">
                  {pricing.shipping === 0 ? 'Free shipping' : `$${pricing.shipping.toFixed(2)}`}
                </span>
              </div>
              {pricing.rewardDiscount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Rewards Discount</span>
                  <span className="text-sm font-semibold text-green-400">-${pricing.rewardDiscount.toFixed(2)}</span>
                </div>
              )}

              {authUser ? (
                <div className="pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-widest text-gray-500">Rewards</p>
                    <p className="text-[11px] font-semibold text-[#F9F6F0]">{rewardsProfile.points} pts</p>
                  </div>

                  {activeReward ? (
                    <div className="mt-1.5 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-300 truncate">{activeReward.name}</p>
                      <button
                        type="button"
                        onClick={handleRemoveReward}
                        className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] hover:text-[#F9F6F0]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsRewardsExpanded((previous) => !previous)}
                        className="mt-1 text-[11px] uppercase tracking-wider text-gray-400 hover:text-[#D4AF37]"
                        aria-expanded={isRewardsExpanded}
                      >
                        {isRewardsExpanded ? 'Hide rewards' : 'Apply rewards'}
                      </button>
                      {isRewardsExpanded && (
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {REWARD_OFFERS.map((offer) => (
                            <button
                              key={offer.id}
                              type="button"
                              onClick={() => handleApplyReward(offer.id)}
                              disabled={!rewardsProfile.enrolled || rewardsProfile.points < offer.pointsCost || cartDisplayItems.length === 0}
                              className="text-left border border-gray-700 px-3 py-2 text-[11px] uppercase tracking-wide font-bold text-[#F9F6F0] enabled:hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {offer.name} - {offer.pointsCost} pts
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {rewardStatus.message && (
                    <p className={`mt-2 text-xs ${rewardStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                      {rewardStatus.message}
                    </p>
                  )}
                </div>
              ) : (
                <p className="pt-1 border-t border-white/10 text-[11px] text-gray-400">
                  Prefer a saved ritual? Sign in for rewards and order history.
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-gray-500">Total</span>
            <span className="font-serif text-[1.4rem] text-[#F9F6F0]">${pricing.total.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {pricing.subtotal >= FREE_SHIPPING_THRESHOLD
              ? 'Free shipping unlocked'
              : `$${amountToFreeShipping.toFixed(2)} away from free shipping`}
          </p>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={cartDisplayItems.length === 0}
            className={`mt-3 w-full bg-[#D4AF37] text-[#0B0C0C] py-3 text-xs font-bold uppercase tracking-wider ${cartDisplayItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
          >
            CHECKOUT
          </button>
          <button
            type="button"
            onClick={handleCloseCart}
            className="mt-2.5 w-full border border-gray-700 text-gray-300 py-3 text-xs font-bold uppercase tracking-wider hover:border-[#D4AF37] hover:text-[#F9F6F0]"
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
};

const createEmptyPaymentSession = () => ({
  orderDraftId: '',
  paymentIntentId: '',
  clientSecret: '',
  totals: null,
  notices: [],
  rewardIdUsed: null,
});

/*
Checkout flow audit (2026-03-02):
- Flow type: Stripe Payment Element mounted on step 3.
- Endpoint: POST /api/create-payment-intent for intent creation/updates and totals.
- Client-side fields collected before payment: customer details + shipping address/service.
- Cart payload sent as aggregated line items: [{ productId, quantity }].
*/
const CheckoutView = ({
  cart,
  rewardsProfile,
  authUser,
  authAccessToken,
  setView,
  onOpenCart,
  onOpenAuthModal,
  onRemoveReward,
  onCheckoutSuccess,
}) => {
  const subtotal = getCartSubtotal(cart);
  const totalCartQuantity = getCartTotalQuantity(cart);
  const activeRewardId = authUser ? rewardsProfile.activeRewardId : null;
  const pricing = getCheckoutPricing(subtotal, activeRewardId);
  const defaultCountry = SUPPORTED_COUNTRY_CODES.includes('US') ? 'US' : (SUPPORTED_COUNTRY_CODES[0] || '');

  const checkoutItems = useMemo(() => getCheckoutItemsFromCart(cart)
    .map((entry) => {
      const product = getProductsCatalog().find((item) => item.id === entry.productId);
      if (!product) return null;
      return {
        ...entry,
        name: product.name,
        subtitle: product.subtitle,
        price: product.price,
      };
    })
    .filter(Boolean), [cart]);

  const [step, setStep] = useState(1);
  const [showPhone, setShowPhone] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const [stepNotice, setStepNotice] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [rewardAuthPrompt, setRewardAuthPrompt] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentSession, setPaymentSession] = useState(() => createEmptyPaymentSession());
  const [formData, setFormData] = useState(() => ({
    customer: {
      name: '',
      email: authUser?.email || rewardsProfile.email || '',
      phone: '',
    },
    shipping: {
      country: defaultCountry,
      service: 'standard',
      address1: '',
      address2: '',
      city: '',
      region: '',
      postalCode: '',
    },
  }));

  const fieldRefs = useRef({});
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const paymentElementRef = useRef(null);
  const paymentMountRef = useRef(null);
  const processedPurchaseRef = useRef('');

  const countryOptions = useMemo(() => SUPPORTED_COUNTRY_CODES
    .filter((countryCode) => Boolean(SHIPPING_ZONES[countryCode]))
    .map((countryCode) => ({
      value: countryCode,
      label: SHIPPING_ZONES[countryCode]?.label || countryCode,
    })), []);

  const shippingServiceOptions = useMemo(() => {
    const zone = SHIPPING_ZONES[formData.shipping.country];
    if (!zone?.services) {
      return [{ value: 'standard', label: 'Standard' }];
    }
    return Object.entries(zone.services).map(([value, config]) => ({
      value,
      label: config?.label || value,
    }));
  }, [formData.shipping.country]);

  const activeReward = getRewardOffer(activeRewardId);
  const calculatedTotals = paymentSession.totals;
  const summaryTotal = calculatedTotals?.total ?? subtotal;
  const showCalculatedTotals = step >= 3 && Boolean(calculatedTotals);
  const mobileSummaryShippingCopy = showCalculatedTotals
    ? (Number(calculatedTotals?.shipping || 0) <= 0
      ? 'Shipping: Free'
      : `Shipping: $${Number(calculatedTotals?.shipping || 0).toFixed(2)}`)
    : 'Shipping calculated at payment.';

  const clearFieldError = useCallback((fieldKey) => {
    setFieldErrors((previousErrors) => {
      if (!previousErrors[fieldKey]) return previousErrors;
      const nextErrors = { ...previousErrors };
      delete nextErrors[fieldKey];
      return nextErrors;
    });
  }, []);

  const registerFieldRef = useCallback((fieldKey) => (element) => {
    if (element) {
      fieldRefs.current[fieldKey] = element;
      return;
    }
    delete fieldRefs.current[fieldKey];
  }, []);

  const focusFirstFieldError = useCallback((nextErrors, orderedKeys) => {
    const firstInvalidField = orderedKeys.find((key) => nextErrors[key]);
    if (!firstInvalidField) return;
    requestAnimationFrame(() => {
      const element = fieldRefs.current[firstInvalidField];
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof element.focus === 'function') {
        element.focus();
      }
    });
  }, []);

  const validateDetailsStep = useCallback(() => {
    const nextErrors = {};
    const name = formData.customer.name.trim();
    const email = formData.customer.email.trim().toLowerCase();
    const phone = formData.customer.phone.trim();

    if (name.length < 2) {
      nextErrors['customer.name'] = 'Please enter your full name.';
    }
    if (!isValidEmail(email)) {
      nextErrors['customer.email'] = 'Please enter a valid email address.';
    }
    if (showPhone && phone && phone.length < 7) {
      nextErrors['customer.phone'] = 'Please enter a valid phone number.';
    }

    return nextErrors;
  }, [formData.customer.email, formData.customer.name, formData.customer.phone, showPhone]);

  const validateShippingStep = useCallback(() => {
    const nextErrors = {};
    const shipping = formData.shipping;
    if (!shipping.country) nextErrors['shipping.country'] = 'Select a shipping destination.';
    if (!shipping.service) nextErrors['shipping.service'] = 'Select a shipping service.';
    if (!shipping.address1.trim()) nextErrors['shipping.address1'] = 'Address line 1 is required.';
    if (!shipping.city.trim()) nextErrors['shipping.city'] = 'City is required.';
    if (!shipping.region.trim()) nextErrors['shipping.region'] = 'State/region is required.';
    if (!shipping.postalCode.trim()) nextErrors['shipping.postalCode'] = 'Postal code is required.';
    return nextErrors;
  }, [formData.shipping]);

  const clearInlineNotices = useCallback(() => {
    setStepNotice('');
    setRewardAuthPrompt('');
    setPaymentError('');
  }, []);

  const handleCustomerFieldChange = useCallback((field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      customer: {
        ...previousData.customer,
        [field]: value,
      },
    }));
    clearFieldError(`customer.${field}`);
    setStepNotice('');
    if (field === 'email') {
      setRewardAuthPrompt('');
    }
  }, [clearFieldError]);

  const handleShippingFieldChange = useCallback((field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      shipping: {
        ...previousData.shipping,
        [field]: value,
      },
    }));
    clearFieldError(`shipping.${field}`);
    setStepNotice('');
  }, [clearFieldError]);

  useEffect(() => {
    setFormData((previousData) => {
      if (previousData.customer.email || (!authUser?.email && !rewardsProfile.email)) {
        return previousData;
      }
      return {
        ...previousData,
        customer: {
          ...previousData.customer,
          email: authUser?.email || rewardsProfile.email || '',
        },
      };
    });
  }, [authUser?.email, rewardsProfile.email]);

  useEffect(() => {
    if (!shippingServiceOptions.length) return;
    if (shippingServiceOptions.some((option) => option.value === formData.shipping.service)) return;
    setFormData((previousData) => ({
      ...previousData,
      shipping: {
        ...previousData.shipping,
        service: shippingServiceOptions[0].value,
      },
    }));
  }, [formData.shipping.service, shippingServiceOptions]);

  useEffect(() => {
    if (cart.length !== 0) return;
    setStep(1);
    setIsMobileSummaryOpen(false);
    setFieldErrors({});
    clearInlineNotices();
    setPaymentSession(createEmptyPaymentSession());
  }, [cart.length, clearInlineNotices]);

  const handlePaymentSuccess = useCallback((paymentIntentPayload = null) => {
    const paymentIntentId = typeof paymentIntentPayload?.id === 'string'
      ? paymentIntentPayload.id
      : (paymentSession.paymentIntentId || paymentSession.orderDraftId || 'checkout-success');
    if (processedPurchaseRef.current === paymentIntentId) return;
    processedPurchaseRef.current = paymentIntentId;

    const purchaseValue = Number((paymentSession.totals?.total ?? pricing.total).toFixed(2));
    setCheckoutNotice('Payment completed. Thank you for your order.');
    setStepNotice('');
    setPaymentError('');
    setStep(1);
    setIsMobileSummaryOpen(false);

    if (typeof onCheckoutSuccess === 'function') {
      onCheckoutSuccess({
        total: purchaseValue,
        reward: paymentSession.rewardIdUsed ? { id: paymentSession.rewardIdUsed } : null,
        earnablePoints: 0,
      });
    }

    trackEvent('purchase', {
      currency: 'USD',
      value: purchaseValue,
      item_count: totalCartQuantity,
    });

    setPaymentSession(createEmptyPaymentSession());
  }, [onCheckoutSuccess, paymentSession.orderDraftId, paymentSession.paymentIntentId, paymentSession.rewardIdUsed, paymentSession.totals, pricing.total, totalCartQuantity]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'complete') return;

    const clientSecretFromQuery = params.get('payment_intent_client_secret') || '';
    const clearCheckoutParams = () => {
      params.delete('checkout');
      params.delete('payment_intent');
      params.delete('payment_intent_client_secret');
      params.delete('redirect_status');
      const cleanedQuery = params.toString();
      const cleanedUrl = `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ''}`;
      window.history.replaceState(window.history.state, '', cleanedUrl);
    };

    const verifyPaymentStatus = async () => {
      if (!STRIPE_PUBLISHABLE_KEY) {
        setPaymentError('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
        clearCheckoutParams();
        return;
      }

      if (!clientSecretFromQuery) {
        setCheckoutNotice('Payment completed. Thank you for your order.');
        clearCheckoutParams();
        return;
      }

      try {
        const StripeConstructor = await loadStripeJs();
        const stripe = stripeRef.current || StripeConstructor(STRIPE_PUBLISHABLE_KEY);
        stripeRef.current = stripe;
        const result = await stripe.retrievePaymentIntent(clientSecretFromQuery);
        const paymentIntent = result?.paymentIntent;
        if (paymentIntent?.status === 'succeeded') {
          handlePaymentSuccess(paymentIntent);
        } else if (paymentIntent?.status === 'processing') {
          setCheckoutNotice('Payment is processing. We will update this page shortly.');
        } else {
          setPaymentError('Payment confirmation is still pending. Please try again.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to verify payment status right now.';
        setPaymentError(message);
      } finally {
        clearCheckoutParams();
      }
    };

    verifyPaymentStatus();
  }, [handlePaymentSuccess]);

  useEffect(() => {
    if (step !== 3 || !paymentSession.clientSecret) return undefined;
    if (!paymentMountRef.current) return undefined;

    let cancelled = false;
    const mountPaymentElement = async () => {
      setPaymentError('');
      setIsPaymentElementReady(false);

      try {
        if (!STRIPE_PUBLISHABLE_KEY) {
          throw new Error('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
        }

        const StripeConstructor = await loadStripeJs();
        const stripe = stripeRef.current || StripeConstructor(STRIPE_PUBLISHABLE_KEY);
        stripeRef.current = stripe;
        if (!stripe || typeof stripe.elements !== 'function') {
          throw new Error('Stripe payment form is unavailable right now.');
        }

        const elements = stripe.elements({
          clientSecret: paymentSession.clientSecret,
          appearance: {
            theme: 'night',
            variables: {
              colorPrimary: '#D4AF37',
              colorBackground: '#0B0C0C',
              colorText: '#F9F6F0',
              colorTextSecondary: '#A8A8A8',
              borderRadius: '2px',
            },
          },
        });

        const paymentElement = elements.create('payment', {
          layout: 'tabs',
        });

        paymentElement.mount(paymentMountRef.current);
        elementsRef.current = elements;
        paymentElementRef.current = paymentElement;
        if (!cancelled) {
          setIsPaymentElementReady(true);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize secure payment form.';
        if (!cancelled) {
          setPaymentError(message);
        }
      }
    };

    mountPaymentElement();

    return () => {
      cancelled = true;
      if (paymentElementRef.current) {
        try {
          paymentElementRef.current.unmount();
        } catch {
          // Stripe Element might already be unmounted.
        }
      }
      paymentElementRef.current = null;
      elementsRef.current = null;
      setIsPaymentElementReady(false);
    };
  }, [paymentSession.clientSecret, step]);

  const handleContinueDetails = useCallback(() => {
    clearInlineNotices();
    const nextErrors = validateDetailsStep();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstFieldError(nextErrors, ['customer.name', 'customer.email', 'customer.phone']);
      return;
    }

    setFieldErrors({});
    setStep(2);
  }, [clearInlineNotices, focusFirstFieldError, validateDetailsStep]);

  const handleContinueShipping = useCallback(async () => {
    clearInlineNotices();
    const nextErrors = validateShippingStep();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstFieldError(nextErrors, ['shipping.country', 'shipping.service', 'shipping.address1', 'shipping.city', 'shipping.region', 'shipping.postalCode']);
      return;
    }

    if (!STRIPE_PUBLISHABLE_KEY) {
      setStepNotice('Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setFieldErrors({});
    setIsSubmittingStep(true);

    try {
      const customerPayload = {
        name: formData.customer.name.trim(),
        email: formData.customer.email.trim().toLowerCase(),
        ...(showPhone && formData.customer.phone.trim() ? { phone: formData.customer.phone.trim() } : {}),
        ...(authUser?.id ? { userId: authUser.id } : {}),
      };
      const shippingPayload = {
        country: formData.shipping.country,
        service: formData.shipping.service || 'standard',
        address1: formData.shipping.address1.trim(),
        address2: formData.shipping.address2.trim(),
        city: formData.shipping.city.trim(),
        region: formData.shipping.region.trim(),
        postalCode: formData.shipping.postalCode.trim(),
      };

      const headers = {
        'Content-Type': 'application/json',
      };
      if (authAccessToken) {
        headers.Authorization = `Bearer ${authAccessToken}`;
      }

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify({
          items: getCheckoutItemsFromCart(cart),
          customer: customerPayload,
          shipping: shippingPayload,
          rewardId: activeRewardId || null,
          orderDraftId: paymentSession.orderDraftId || undefined,
          paymentIntentId: paymentSession.paymentIntentId || undefined,
          clientSecret: paymentSession.clientSecret || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorCode = typeof payload?.code === 'string' ? payload.code : '';
        const message = typeof payload?.error === 'string' && payload.error
          ? payload.error
          : 'Unable to continue checkout right now.';

        if (errorCode === 'invalid_customer') {
          const detailsErrors = validateDetailsStep();
          if (!detailsErrors['customer.name'] && message.toLowerCase().includes('name')) {
            detailsErrors['customer.name'] = message;
          }
          if (!detailsErrors['customer.email'] && message.toLowerCase().includes('email')) {
            detailsErrors['customer.email'] = message;
          }
          setFieldErrors(detailsErrors);
          setStep(1);
          setStepNotice(message);
          focusFirstFieldError(detailsErrors, ['customer.name', 'customer.email', 'customer.phone']);
          return;
        }

        if (errorCode === 'incomplete_shipping' || errorCode === 'unsupported_destination' || errorCode === 'invalid_shipping_service') {
          const shippingErrors = validateShippingStep();
          if (errorCode === 'unsupported_destination') {
            shippingErrors['shipping.country'] = message;
          }
          if (errorCode === 'invalid_shipping_service') {
            shippingErrors['shipping.service'] = message;
          }
          if (errorCode === 'incomplete_shipping' && !shippingErrors['shipping.address1']) {
            shippingErrors['shipping.address1'] = message;
          }
          setFieldErrors(shippingErrors);
          setStep(2);
          setStepNotice(message);
          focusFirstFieldError(shippingErrors, ['shipping.country', 'shipping.service', 'shipping.address1', 'shipping.city', 'shipping.region', 'shipping.postalCode']);
          return;
        }

        if (errorCode === 'auth_required') {
          setRewardAuthPrompt('Sign in to apply account rewards.');
          setStepNotice('Sign in to apply account rewards.');
          setStep(1);
          return;
        }

        if (errorCode === 'reward_not_active') {
          if (typeof onRemoveReward === 'function') {
            onRemoveReward();
          }
          setStepNotice('Your active reward is no longer available and was removed.');
          return;
        }

        setStepNotice(message);
        return;
      }

      setPaymentSession({
        orderDraftId: payload.orderDraftId || '',
        paymentIntentId: payload.paymentIntentId || '',
        clientSecret: payload.clientSecret || '',
        totals: payload.totals || null,
        notices: Array.isArray(payload.notices) ? payload.notices : [],
        rewardIdUsed: activeRewardId || null,
      });
      setCheckoutNotice(
        Array.isArray(payload.notices) && payload.notices[0]?.message
          ? payload.notices[0].message
          : '',
      );
      setStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to continue checkout right now.';
      setStepNotice(message);
    } finally {
      setIsSubmittingStep(false);
    }
  }, [
    activeRewardId,
    authAccessToken,
    authUser?.id,
    cart,
    clearInlineNotices,
    focusFirstFieldError,
    formData.customer.email,
    formData.customer.name,
    formData.customer.phone,
    formData.shipping.address1,
    formData.shipping.address2,
    formData.shipping.city,
    formData.shipping.country,
    formData.shipping.postalCode,
    formData.shipping.region,
    formData.shipping.service,
    onRemoveReward,
    paymentSession.clientSecret,
    paymentSession.orderDraftId,
    paymentSession.paymentIntentId,
    showPhone,
    validateDetailsStep,
    validateShippingStep,
  ]);

  const handlePaySecurely = useCallback(async () => {
    if (!stripeRef.current || !elementsRef.current) {
      setPaymentError('Secure payment form is still loading.');
      return;
    }

    setIsPaying(true);
    setPaymentError('');
    setStepNotice('');

    const submittedValue = Number((paymentSession.totals?.total ?? pricing.total).toFixed(2));
    trackEvent('checkout_submit', {
      currency: 'USD',
      value: submittedValue,
      item_count: totalCartQuantity,
      reward_id: activeRewardId || undefined,
    });

    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}?checkout=complete`;
      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (result?.error) {
        const message = result.error.message || 'Unable to complete payment right now.';
        setPaymentError(message);
        trackEvent('checkout_error', { message });
        return;
      }

      const paymentIntent = result?.paymentIntent;
      if (paymentIntent?.status === 'succeeded') {
        handlePaymentSuccess(paymentIntent);
      } else if (paymentIntent?.status === 'processing') {
        setCheckoutNotice('Payment is processing. We will update this page shortly.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete payment right now.';
      setPaymentError(message);
      trackEvent('checkout_error', { message });
    } finally {
      setIsPaying(false);
    }
  }, [activeRewardId, handlePaymentSuccess, paymentSession.totals, pricing.total, totalCartQuantity]);

  const handleBackStep = () => {
    clearInlineNotices();
    setStep((previousStep) => Math.max(1, previousStep - 1));
  };

  const handleStepAction = async () => {
    if (step === 1) {
      handleContinueDetails();
      return;
    }
    if (step === 2) {
      await handleContinueShipping();
      return;
    }
    await handlePaySecurely();
  };

  const renderStepButtons = () => (
    <div className="mt-6 flex items-center justify-between gap-3">
      {step > 1 ? (
        <button
          type="button"
          onClick={handleBackStep}
          className="border border-gray-300 text-[#0B0C0C] px-4 py-3 text-xs font-bold tracking-wide hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          Back
        </button>
      ) : <span />}
      <button
        type="button"
        onClick={handleStepAction}
        disabled={isSubmittingStep || isPaying || (step === 3 && !isPaymentElementReady)}
        className={`ml-auto bg-[#0B0C0C] text-[#D4AF37] px-5 py-3 text-xs font-bold tracking-wide ${(isSubmittingStep || isPaying || (step === 3 && !isPaymentElementReady)) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#1b1d1d]'}`}
      >
        {step === 3 ? (isPaying ? 'Processing...' : 'PAY SECURELY') : (isSubmittingStep ? 'Continuing...' : 'Continue')}
      </button>
    </div>
  );

  const summaryBreakdown = (
    <>
      <div className="space-y-3">
        {checkoutItems.map((item) => (
          <div key={item.productId} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0B0C0C]">{item.name}</p>
              <p className="text-xs text-gray-500">{item.subtitle}</p>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">Qty ×{item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-[#0B0C0C]">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-gray-200 pt-4 space-y-2 text-sm">
        {showCalculatedTotals ? (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-[#0B0C0C]">${Number(calculatedTotals.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(calculatedTotals.discount || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-green-700">-${Number(calculatedTotals.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-[#0B0C0C]">${Number(calculatedTotals.shipping || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold text-[#0B0C0C]">${Number(calculatedTotals.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-2">
              <span className="text-xs uppercase tracking-wider text-gray-700">Total</span>
              <span className="font-serif text-2xl text-[#0B0C0C]">${Number(calculatedTotals.total || 0).toFixed(2)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated subtotal</span>
              <span className="font-semibold text-[#0B0C0C]">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">Shipping calculated at payment.</p>
          </>
        )}
      </div>
    </>
  );

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
          <section className="bg-white border border-gray-200 p-5 md:p-7">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-[#0B0C0C]">Secure Checkout</h1>
                <p className="mt-2 text-xs text-gray-500">
                  Encrypted Stripe checkout. Card details are never stored on Velure servers.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCart}
                className="text-xs uppercase tracking-widest font-bold text-[#0B0C0C] border border-[#0B0C0C] px-3 py-2 hover:bg-[#0B0C0C] hover:text-[#F9F6F0]"
              >
                Edit Cart
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {['Details', 'Shipping', 'Payment'].map((label, index) => {
                const stepNumber = index + 1;
                const isActive = step === stepNumber;
                const canSelect = stepNumber <= step;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={!canSelect}
                    onClick={() => {
                      if (!canSelect) return;
                      setStep(stepNumber);
                    }}
                    className={`border px-2 py-2 text-[11px] tracking-wide ${
                      isActive
                        ? 'border-[#D4AF37] bg-[#0B0C0C] text-[#D4AF37]'
                        : canSelect
                          ? 'border-gray-300 text-gray-600 hover:border-[#D4AF37] hover:text-[#0B0C0C]'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="lg:hidden mb-4 border border-gray-200">
              <button
                type="button"
                onClick={() => setIsMobileSummaryOpen((previous) => !previous)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
                aria-expanded={isMobileSummaryOpen}
              >
                <span className="text-xs uppercase tracking-widest text-gray-600">Order summary</span>
                <span className="text-right">
                  <span className="block font-serif text-lg text-[#0B0C0C]">${summaryTotal.toFixed(2)}</span>
                  <span className="block text-[11px] text-gray-500">{mobileSummaryShippingCopy}</span>
                </span>
              </button>
              <div className={`motion-accordion-panel ${isMobileSummaryOpen ? 'is-open' : ''}`}>
                <div className="px-4 pb-4 border-t border-gray-100">
                  {summaryBreakdown}
                </div>
              </div>
            </div>

            {checkoutNotice && (
              <p className="mb-4 text-sm text-green-700" role="status">
                {checkoutNotice}
              </p>
            )}
            {stepNotice && (
              <p className="mb-4 text-sm text-[#8A5A5A]" role="status">
                {stepNotice}
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
                {step === 1 && (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-gray-600">Full name</span>
                      <input
                        ref={registerFieldRef('customer.name')}
                        type="text"
                        autoComplete="name"
                        value={formData.customer.name}
                        onChange={(event) => handleCustomerFieldChange('name', event.target.value)}
                        className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['customer.name'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                      />
                      {fieldErrors['customer.name'] && (
                        <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['customer.name']}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-gray-600">Email</span>
                      <input
                        ref={registerFieldRef('customer.email')}
                        type="email"
                        autoComplete="email"
                        value={formData.customer.email}
                        onChange={(event) => handleCustomerFieldChange('email', event.target.value)}
                        className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['customer.email'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                      />
                      {fieldErrors['customer.email'] && (
                        <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['customer.email']}</p>
                      )}
                    </label>

                    <div className="border border-gray-200 bg-[#F8F6F2] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof onOpenAuthModal === 'function') {
                              onOpenAuthModal();
                              return;
                            }
                            setView('account');
                          }}
                          className="text-xs font-bold uppercase tracking-wider text-[#0B0C0C] hover:text-[#D4AF37]"
                        >
                          Sign in for rewards and saved orders
                        </button>
                        {activeReward && (
                          <span className="text-[11px] text-[#0B0C0C]/70">Reward: {activeReward.name}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Guest checkout is always available.</p>
                      {rewardAuthPrompt && (
                        <p className="mt-2 text-xs text-[#8A5A5A]">{rewardAuthPrompt}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPhone((previousState) => !previousState);
                        if (showPhone) {
                          handleCustomerFieldChange('phone', '');
                        }
                      }}
                      className="text-xs uppercase tracking-wider text-gray-600 hover:text-[#0B0C0C]"
                      aria-expanded={showPhone}
                    >
                      {showPhone ? 'Hide phone field' : 'Add phone for delivery updates'}
                    </button>

                    {showPhone && (
                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">Phone (optional)</span>
                        <input
                          ref={registerFieldRef('customer.phone')}
                          type="tel"
                          autoComplete="tel"
                          value={formData.customer.phone}
                          onChange={(event) => handleCustomerFieldChange('phone', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['customer.phone'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        />
                        {fieldErrors['customer.phone'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['customer.phone']}</p>
                        )}
                      </label>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">Country</span>
                        <select
                          ref={registerFieldRef('shipping.country')}
                          value={formData.shipping.country}
                          onChange={(event) => handleShippingFieldChange('country', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none bg-white ${fieldErrors['shipping.country'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        >
                          {countryOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {fieldErrors['shipping.country'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.country']}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">Shipping service</span>
                        <select
                          ref={registerFieldRef('shipping.service')}
                          value={formData.shipping.service}
                          onChange={(event) => handleShippingFieldChange('service', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none bg-white ${fieldErrors['shipping.service'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        >
                          {shippingServiceOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {fieldErrors['shipping.service'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.service']}</p>
                        )}
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-gray-600">Address line 1</span>
                      <input
                        ref={registerFieldRef('shipping.address1')}
                        type="text"
                        autoComplete="address-line1"
                        value={formData.shipping.address1}
                        onChange={(event) => handleShippingFieldChange('address1', event.target.value)}
                        className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['shipping.address1'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                      />
                      {fieldErrors['shipping.address1'] && (
                        <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.address1']}</p>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-xs uppercase tracking-wider text-gray-600">Address line 2 (optional)</span>
                      <input
                        type="text"
                        autoComplete="address-line2"
                        value={formData.shipping.address2}
                        onChange={(event) => handleShippingFieldChange('address2', event.target.value)}
                        className="mt-2 w-full border border-gray-300 px-4 py-3 text-sm text-[#0B0C0C] outline-none focus:border-[#D4AF37]"
                      />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">City</span>
                        <input
                          ref={registerFieldRef('shipping.city')}
                          type="text"
                          autoComplete="address-level2"
                          value={formData.shipping.city}
                          onChange={(event) => handleShippingFieldChange('city', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['shipping.city'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        />
                        {fieldErrors['shipping.city'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.city']}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">State / Region</span>
                        <input
                          ref={registerFieldRef('shipping.region')}
                          type="text"
                          autoComplete="address-level1"
                          value={formData.shipping.region}
                          onChange={(event) => handleShippingFieldChange('region', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['shipping.region'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        />
                        {fieldErrors['shipping.region'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.region']}</p>
                        )}
                      </label>

                      <label className="block">
                        <span className="text-xs uppercase tracking-wider text-gray-600">ZIP / Postal code</span>
                        <input
                          ref={registerFieldRef('shipping.postalCode')}
                          type="text"
                          autoComplete="postal-code"
                          value={formData.shipping.postalCode}
                          onChange={(event) => handleShippingFieldChange('postalCode', event.target.value)}
                          className={`mt-2 w-full border px-4 py-3 text-sm text-[#0B0C0C] outline-none ${fieldErrors['shipping.postalCode'] ? 'border-[#B57F7F]' : 'border-gray-300 focus:border-[#D4AF37]'}`}
                        />
                        {fieldErrors['shipping.postalCode'] && (
                          <p className="mt-1 text-xs text-[#8A5A5A]">{fieldErrors['shipping.postalCode']}</p>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Review and complete your order.</p>
                    {paymentSession.notices.map((notice, index) => (
                      <p key={`${notice.type || 'notice'}-${index}`} className="text-xs text-gray-500">
                        {notice.message}
                      </p>
                    ))}

                    {!paymentSession.clientSecret && (
                      <p className="text-sm text-[#8A5A5A]">
                        Return to Shipping and continue to initialize secure payment.
                      </p>
                    )}

                    <div className="border border-gray-300 bg-white p-3 min-h-[240px]">
                      {!isPaymentElementReady && (
                        <p className="text-sm text-gray-500 mb-3">Loading payment form...</p>
                      )}
                      <div ref={paymentMountRef} />
                    </div>

                    {paymentError && (
                      <p className="text-sm text-[#8A5A5A]" role="alert">
                        {paymentError}
                      </p>
                    )}
                  </div>
                )}

                {renderStepButtons()}
              </>
            )}
          </section>

          <aside className="hidden lg:block">
            <div className="bg-white border border-gray-200 p-6 sticky top-28">
              <h2 className="font-serif text-2xl text-[#0B0C0C] mb-4">Order summary</h2>
              {summaryBreakdown}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const ROAST_SORT_ORDER = { light: 0, medium: 1, dark: 2 };
const COLLECTION_FILTER_DEFAULTS = {
  sort: 'featured',
  roast: 'all',
  format: 'all',
  decaf: 'all',
  bundleType: 'all',
};

const SORT_FILTER_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'roast-asc', label: 'Roast: Light → Medium → Dark' },
];

const ROAST_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'dark', label: 'Dark' },
];

const FORMAT_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'beans', label: 'Beans' },
  { value: 'pods', label: 'Pods' },
  { value: 'instant', label: 'Instant' },
  { value: 'ground', label: 'Ground' },
  { value: 'matcha', label: 'Matcha' },
];

const DECAF_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'decaf', label: 'Decaf Only' },
];

const BUNDLE_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ritual', label: 'Ritual' },
  { value: 'starter', label: 'Starter' },
  { value: 'dark', label: 'Dark' },
  { value: 'bright', label: 'Bright' },
];

const isValidFilterValue = (options, value) => options.some((option) => option.value === value);

const normalizeLegacySortValue = (value) => {
  if (value === 'price_low') return 'price-asc';
  if (value === 'price_high') return 'price-desc';
  if (value === 'roast') return 'roast-asc';
  return value;
};

const parseCollectionFiltersFromSearch = (search) => {
  const params = new URLSearchParams(search || '');
  const rawSort = normalizeLegacySortValue(normalizeLower(params.get('sort') || ''));
  const sort = isValidFilterValue(SORT_FILTER_OPTIONS, rawSort) ? rawSort : COLLECTION_FILTER_DEFAULTS.sort;
  const roast = isValidFilterValue(ROAST_FILTER_OPTIONS, normalizeLower(params.get('roast') || ''))
    ? normalizeLower(params.get('roast') || '')
    : COLLECTION_FILTER_DEFAULTS.roast;
  const format = isValidFilterValue(FORMAT_FILTER_OPTIONS, normalizeLower(params.get('format') || ''))
    ? normalizeLower(params.get('format') || '')
    : COLLECTION_FILTER_DEFAULTS.format;
  const decaf = isValidFilterValue(DECAF_FILTER_OPTIONS, normalizeLower(params.get('decaf') || ''))
    ? normalizeLower(params.get('decaf') || '')
    : COLLECTION_FILTER_DEFAULTS.decaf;
  const bundleType = isValidFilterValue(BUNDLE_TYPE_FILTER_OPTIONS, normalizeLower(params.get('bundleType') || ''))
    ? normalizeLower(params.get('bundleType') || '')
    : COLLECTION_FILTER_DEFAULTS.bundleType;

  return {
    sort,
    roast,
    format,
    decaf,
    bundleType,
  };
};

const getProductFormat = (product) => {
  const productId = normalizeLower(product?.id || '');
  const subtitle = normalizeLower(product?.subtitle || '');
  const productAmount = normalizeLower(product?.nutritionSpecs?.productAmount || '');
  const detailsWeight = normalizeLower(product?.details?.weight || '');

  if (productId.endsWith('-pods') || productAmount.includes('pods')) {
    return 'pods';
  }

  if (subtitle.includes('matcha') || normalizeLower(product?.name || '') === 'zen') {
    return 'matcha';
  }

  if (subtitle.includes('instant') || productAmount.includes('1.9') || detailsWeight.includes('54 g')) {
    return 'instant';
  }

  if (subtitle.includes('ground')) {
    return 'ground';
  }

  return 'beans';
};

const getBundleType = (product) => {
  const productId = normalizeLower(product?.id || '');
  if (productId === 'bundle-ritual-set') return 'ritual';
  if (productId === 'bundle-starter') return 'starter';
  if (productId === 'bundle-dark-set') return 'dark';
  if (productId === 'bundle-bright-set') return 'bright';
  return 'all';
};

const isDecafProduct = (product) => {
  const productName = normalizeLower(product?.name || '');
  const subtitle = normalizeLower(product?.subtitle || '');
  const tag = normalizeLower(product?.tag || '');
  const productId = normalizeLower(product?.id || '');
  return productId === 'forest' || productName.includes('decaf') || subtitle.includes('decaf') || tag.includes('decaf');
};

const normalizeCollectionFilters = (filters, category) => {
  const nextFilters = {
    ...COLLECTION_FILTER_DEFAULTS,
    ...(filters || {}),
  };

  const normalizedSort = normalizeLegacySortValue(normalizeLower(nextFilters.sort || ''));
  nextFilters.sort = isValidFilterValue(SORT_FILTER_OPTIONS, normalizedSort) ? normalizedSort : COLLECTION_FILTER_DEFAULTS.sort;
  nextFilters.roast = isValidFilterValue(ROAST_FILTER_OPTIONS, normalizeLower(nextFilters.roast || ''))
    ? normalizeLower(nextFilters.roast || '')
    : COLLECTION_FILTER_DEFAULTS.roast;
  nextFilters.format = isValidFilterValue(FORMAT_FILTER_OPTIONS, normalizeLower(nextFilters.format || ''))
    ? normalizeLower(nextFilters.format || '')
    : COLLECTION_FILTER_DEFAULTS.format;
  nextFilters.decaf = isValidFilterValue(DECAF_FILTER_OPTIONS, normalizeLower(nextFilters.decaf || ''))
    ? normalizeLower(nextFilters.decaf || '')
    : COLLECTION_FILTER_DEFAULTS.decaf;
  nextFilters.bundleType = isValidFilterValue(BUNDLE_TYPE_FILTER_OPTIONS, normalizeLower(nextFilters.bundleType || ''))
    ? normalizeLower(nextFilters.bundleType || '')
    : COLLECTION_FILTER_DEFAULTS.bundleType;

  if (category === 'bundles') {
    nextFilters.roast = COLLECTION_FILTER_DEFAULTS.roast;
    nextFilters.format = COLLECTION_FILTER_DEFAULTS.format;
    nextFilters.decaf = COLLECTION_FILTER_DEFAULTS.decaf;
  }

  if (category !== 'all' && category !== 'single_origin') {
    nextFilters.decaf = COLLECTION_FILTER_DEFAULTS.decaf;
  }

  if (category !== 'bundles') {
    nextFilters.bundleType = COLLECTION_FILTER_DEFAULTS.bundleType;
  }

  return nextFilters;
};

const ShopView = ({ category, openProductDetail, setView }) => {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const collectionTitle = CATEGORY_LABELS[category] || CATEGORY_LABELS.all;
  const filterPanelId = `collection-filters-${category}`;
  const mobileSheetTitleId = `${filterPanelId}-mobile-title`;
  const currentCollectionView = category === 'all'
    ? 'shop_all'
    : category === 'functional'
      ? 'shop_functional'
      : category === 'single_origin'
        ? 'shop_single_origin'
        : category === 'signature'
          ? 'shop_signature'
          : 'shop_bundles';
  const showRoastFilter = category !== 'bundles';
  const showFormatFilter = category !== 'bundles';
  const showDecafFilter = category === 'all' || category === 'single_origin';
  const showBundleTypeFilter = category === 'bundles';
  const hasSignatureCollection = getProductsCatalog().some((product) => product.category === 'signature');
  const hasBundlesCollection = getProductsCatalog().some((product) => product.category === 'bundles');

  const getFiltersFromLocation = useCallback(() => {
    if (typeof window === 'undefined') {
      return normalizeCollectionFilters(COLLECTION_FILTER_DEFAULTS, category);
    }
    return normalizeCollectionFilters(parseCollectionFiltersFromSearch(window.location.search), category);
  }, [category]);

  const [filters, setFilters] = useState(() => getFiltersFromLocation());
  const [mobileDraftFilters, setMobileDraftFilters] = useState(() => getFiltersFromLocation());

  const seriesChips = useMemo(() => ([
    { view: 'shop_all', label: 'All', enabled: true },
    { view: 'shop_functional', label: 'Functional', enabled: getProductsCatalog().some((product) => product.category === 'functional') },
    { view: 'shop_single_origin', label: 'Single Origin', enabled: getProductsCatalog().some((product) => product.category === 'single_origin') },
    { view: 'shop_signature', label: 'Signature', enabled: hasSignatureCollection },
    { view: 'shop_bundles', label: 'Bundles', enabled: hasBundlesCollection },
  ].filter((chip) => chip.enabled)), [hasBundlesCollection, hasSignatureCollection]);

  const defaultFilters = useMemo(
    () => normalizeCollectionFilters(COLLECTION_FILTER_DEFAULTS, category),
    [category],
  );

  const applyFilters = useCallback((nextFilters) => {
    setFilters(normalizeCollectionFilters(nextFilters, category));
  }, [category]);

  const handleDesktopFilterChange = useCallback((key, value) => {
    applyFilters({ ...filters, [key]: value });
  }, [applyFilters, filters]);

  const handleMobileFilterChange = useCallback((key, value) => {
    setMobileDraftFilters((previousFilters) => normalizeCollectionFilters({
      ...previousFilters,
      [key]: value,
    }, category));
  }, [category]);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setMobileDraftFilters(defaultFilters);
  }, [defaultFilters]);

  const handleClearMobileFilters = useCallback(() => {
    setMobileDraftFilters(defaultFilters);
  }, [defaultFilters]);

  const handleApplyMobileFilters = useCallback(() => {
    applyFilters(mobileDraftFilters);
    setIsMobileFilterOpen(false);
  }, [applyFilters, mobileDraftFilters]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePopState = () => {
      const nextFilters = getFiltersFromLocation();
      setFilters(nextFilters);
      setMobileDraftFilters(nextFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getFiltersFromLocation]);

  useEffect(() => {
    if (!isMobileFilterOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileFilterOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileFilterOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextFilters = normalizeCollectionFilters(filters, category);
    const params = new URLSearchParams(window.location.search);
    ['sort', 'roast', 'format', 'decaf', 'bundleType'].forEach((param) => params.delete(param));

    if (nextFilters.sort !== COLLECTION_FILTER_DEFAULTS.sort) {
      params.set('sort', nextFilters.sort);
    }
    if (showRoastFilter && nextFilters.roast !== COLLECTION_FILTER_DEFAULTS.roast) {
      params.set('roast', nextFilters.roast);
    }
    if (showFormatFilter && nextFilters.format !== COLLECTION_FILTER_DEFAULTS.format) {
      params.set('format', nextFilters.format);
    }
    if (showDecafFilter && nextFilters.decaf !== COLLECTION_FILTER_DEFAULTS.decaf) {
      params.set('decaf', nextFilters.decaf);
    }
    if (showBundleTypeFilter && nextFilters.bundleType !== COLLECTION_FILTER_DEFAULTS.bundleType) {
      params.set('bundleType', nextFilters.bundleType);
    }

    const queryString = params.toString();
    const nextPath = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (nextPath !== currentPath) {
      window.history.replaceState(window.history.state, '', nextPath);
    }
  }, [category, filters, showBundleTypeFilter, showDecafFilter, showFormatFilter, showRoastFilter]);

  const activeFilterCount = [
    filters.sort !== COLLECTION_FILTER_DEFAULTS.sort,
    showRoastFilter && filters.roast !== COLLECTION_FILTER_DEFAULTS.roast,
    showFormatFilter && filters.format !== COLLECTION_FILTER_DEFAULTS.format,
    showDecafFilter && filters.decaf !== COLLECTION_FILTER_DEFAULTS.decaf,
    showBundleTypeFilter && filters.bundleType !== COLLECTION_FILTER_DEFAULTS.bundleType,
  ].filter(Boolean).length;

  const desktopFilterSummary = showBundleTypeFilter
    ? 'Sort • Bundle Type'
    : showDecafFilter
      ? 'Sort • Roast • Format • Decaf'
      : 'Sort • Roast • Format';

  const scopedProducts = category === 'all'
    ? getProductsCatalog()
    : getProductsCatalog().filter((product) => product.category === category);

  const filteredProducts = scopedProducts.filter((product) => {
    if (showDecafFilter && filters.decaf === 'decaf' && !isDecafProduct(product)) {
      return false;
    }

    if (showRoastFilter && filters.roast !== 'all') {
      const roastValue = normalizeLower(product?.details?.roast || '');
      if (!roastValue || roastValue !== filters.roast) {
        return false;
      }
    }

    if (showFormatFilter && filters.format !== 'all') {
      if (getProductFormat(product) !== filters.format) {
        return false;
      }
    }

    if (showBundleTypeFilter && filters.bundleType !== 'all') {
      if (getBundleType(product) !== filters.bundleType) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = (() => {
    if (filters.sort === 'featured') return filteredProducts;

    const productsToSort = [...filteredProducts];
    if (filters.sort === 'price-asc') {
      return productsToSort.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    }

    if (filters.sort === 'price-desc') {
      return productsToSort.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    }

    if (filters.sort === 'roast-asc') {
      return productsToSort.sort((a, b) => {
        const roastRankA = ROAST_SORT_ORDER[normalizeLower(a?.details?.roast || '')] ?? 99;
        const roastRankB = ROAST_SORT_ORDER[normalizeLower(b?.details?.roast || '')] ?? 99;
        if (roastRankA !== roastRankB) return roastRankA - roastRankB;
        return a.name.localeCompare(b.name);
      });
    }

    return productsToSort;
  })();

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-serif text-[#F9F6F0] mb-4 motion-enter">{collectionTitle}</h1>
        <p className="text-gray-400 font-sans mb-8 max-w-2xl motion-enter">Explore our range of meticulously sourced and roasted coffees, designed to elevate your daily ritual.</p>

        <div className="mb-6 motion-enter" aria-label="Collection switcher">
          <div className="bg-[#0B0C0C] overflow-hidden">
            <div className="chip-scroller flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-2 snap-row md:flex-wrap md:overflow-visible md:whitespace-normal">
              <span aria-hidden="true" className="chip-scroll-spacer md:hidden" />
              {seriesChips.map((chip) => {
                const isActive = chip.view === currentCollectionView;
                return (
                  <button
                    key={chip.view}
                    type="button"
                    onClick={() => setView(chip.view)}
                    className={`snap-item inline-flex shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider border ${
                      isActive
                        ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0B0C0C]'
                        : 'border-gray-700 text-[#F9F6F0] hover:border-[#D4AF37] hover:text-[#D4AF37]'
                    }`}
                    aria-pressed={isActive}
                  >
                    {chip.label}
                  </button>
                );
              })}
              <span aria-hidden="true" className="chip-scroll-spacer md:hidden" />
            </div>
          </div>
        </div>

        <div className="mb-10 motion-enter">
          <div className="md:hidden mb-3">
            <button
              type="button"
              onClick={() => {
                setMobileDraftFilters(filters);
                setIsMobileFilterOpen(true);
              }}
              className="w-full border border-gray-800 bg-[#121212] px-4 py-4 flex items-center justify-between gap-4 text-left"
              aria-haspopup="dialog"
              aria-expanded={isMobileFilterOpen}
              aria-controls={mobileSheetTitleId}
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">Refine Collection</p>
                <p className="text-sm text-gray-300 font-sans mt-1">Filter &amp; Sort</p>
              </div>
              <span className="text-xs uppercase tracking-widest text-gray-400">
                Open{activeFilterCount > 0 ? ` • ${activeFilterCount} active` : ''}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterPanelOpen((previous) => !previous)}
            className="hidden md:flex w-full border border-gray-800 bg-[#121212] px-4 py-4 md:px-5 items-center justify-between gap-4 text-left"
            aria-expanded={isFilterPanelOpen}
            aria-controls={filterPanelId}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">Refine Collection</p>
              <p className="text-sm text-gray-300 font-sans mt-1">{desktopFilterSummary}</p>
            </div>
            <span className="text-xs uppercase tracking-widest text-gray-400">
              {isFilterPanelOpen ? 'Hide' : 'Show'}{activeFilterCount > 0 ? ` • ${activeFilterCount} active` : ''}
            </span>
          </button>

          {isFilterPanelOpen && (
            <div id={filterPanelId} className="hidden md:block border border-t-0 border-gray-800 bg-[#121212] p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Sort</span>
                  <select
                    value={filters.sort}
                    onChange={(event) => handleDesktopFilterChange('sort', event.target.value)}
                    className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                  >
                    {SORT_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                {showRoastFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Roast</span>
                    <select
                      value={filters.roast}
                      onChange={(event) => handleDesktopFilterChange('roast', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {ROAST_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showFormatFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Format</span>
                    <select
                      value={filters.format}
                      onChange={(event) => handleDesktopFilterChange('format', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {FORMAT_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showDecafFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Decaf</span>
                    <select
                      value={filters.decaf}
                      onChange={(event) => handleDesktopFilterChange('decaf', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {DECAF_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showBundleTypeFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Bundle Type</span>
                    <select
                      value={filters.bundleType}
                      onChange={(event) => handleDesktopFilterChange('bundleType', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {BUNDLE_TYPE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">{sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'} shown</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className={`text-xs uppercase tracking-widest underline underline-offset-2 ${activeFilterCount > 0 ? 'text-[#D4AF37] hover:text-[#F9F6F0]' : 'text-gray-600 cursor-default'}`}
              disabled={activeFilterCount === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {isMobileFilterOpen && (
          <div
            className="fixed inset-0 z-[75] bg-black/70 motion-modal-overlay md:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={mobileSheetTitleId}
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-gray-700 bg-[#121212] p-5 max-h-[85vh] overflow-y-auto motion-modal-panel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37]">Refine Collection</p>
                  <h2 id={mobileSheetTitleId} className="font-serif text-3xl text-[#F9F6F0] mt-1">Filter &amp; Sort</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="h-10 w-10 inline-flex items-center justify-center border border-gray-700 text-gray-300 hover:text-[#F9F6F0]"
                  aria-label="Close filter sheet"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Sort</span>
                  <select
                    value={mobileDraftFilters.sort}
                    onChange={(event) => handleMobileFilterChange('sort', event.target.value)}
                    className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                  >
                    {SORT_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                {showRoastFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Roast</span>
                    <select
                      value={mobileDraftFilters.roast}
                      onChange={(event) => handleMobileFilterChange('roast', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {ROAST_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showFormatFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Format</span>
                    <select
                      value={mobileDraftFilters.format}
                      onChange={(event) => handleMobileFilterChange('format', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {FORMAT_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showDecafFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Decaf</span>
                    <select
                      value={mobileDraftFilters.decaf}
                      onChange={(event) => handleMobileFilterChange('decaf', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {DECAF_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}

                {showBundleTypeFilter && (
                  <label className="block">
                    <span className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 block">Bundle Type</span>
                    <select
                      value={mobileDraftFilters.bundleType}
                      onChange={(event) => handleMobileFilterChange('bundleType', event.target.value)}
                      className="w-full border border-gray-700 bg-[#0B0C0C] text-[#F9F6F0] p-3 text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {BUNDLE_TYPE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClearMobileFilters}
                  className="border border-gray-700 text-gray-300 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-gray-500"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApplyMobileFilters}
                  className="bg-[#D4AF37] text-[#0B0C0C] px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} openProductDetail={openProductDetail} />
            ))}
          </div>
        ) : (
          <div className="border border-gray-800 bg-[#121212] p-8 text-center">
            <p className="text-gray-300 font-sans">No products match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BlogView = ({ openBlogPost }) => {
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagListExpanded, setIsTagListExpanded] = useState(false);

  const availableTags = useMemo(() => {
    const tagCounts = new Map();
    getBlogPostsCatalog().forEach((post) => {
      const postTags = Array.isArray(post.tags) ? post.tags : [];
      postTags.forEach((tag) => {
        if (!tag) return;
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((tagA, tagB) => tagB[1] - tagA[1] || tagA[0].localeCompare(tagB[0]))
      .map(([tag]) => tag);
  }, []);
  const topTags = useMemo(() => {
    const baseTopTags = availableTags.slice(0, 6);
    if (
      selectedTag !== 'all'
      && availableTags.includes(selectedTag)
      && !baseTopTags.includes(selectedTag)
    ) {
      return [...baseTopTags.slice(0, 5), selectedTag];
    }
    return baseTopTags;
  }, [availableTags, selectedTag]);
  const remainingTags = useMemo(
    () => availableTags.filter((tag) => !topTags.includes(tag)),
    [availableTags, topTags],
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeLower(searchQuery);
    return getBlogPostsCatalog().filter((post) => {
      if (selectedTag !== 'all') {
        const postTags = Array.isArray(post.tags) ? post.tags : [];
        if (!postTags.includes(selectedTag)) {
          return false;
        }
      }

      if (normalizedQuery) {
        const haystack = `${post.title} ${post.description}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#0B0C0C]/70 mb-3">Velure Journal</p>
        <h1 className="text-4xl md:text-5xl font-serif text-[#0B0C0C] mb-4">Coffee Guides & Ritual Notes</h1>
        <p className="text-gray-700 max-w-3xl mb-8">
          Calm, factual guides with clean-label standards and repeatable coffee rituals. No hype, just useful guidance.
        </p>

        <div className="bg-white border border-gray-200 p-4 md:p-5 mb-8">
          <div className="mb-4">
            <div className="bg-[#0B0C0C] rounded-sm overflow-hidden">
              <div className="chip-scroller flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-2 snap-row" aria-label="Journal tag filters">
                <span aria-hidden="true" className="chip-scroll-spacer" />
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className={`snap-item inline-flex shrink-0 px-3 py-2 text-[11px] uppercase tracking-wider border ${selectedTag === 'all' ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/20 text-[#F9F6F0]/75 hover:border-[#D4AF37] hover:text-[#F9F6F0]'}`}
                  aria-pressed={selectedTag === 'all'}
                >
                  All
                </button>
                {topTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`snap-item inline-flex shrink-0 px-3 py-2 text-[11px] uppercase tracking-wider border ${selectedTag === tag ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-white/20 text-[#F9F6F0]/75 hover:border-[#D4AF37] hover:text-[#F9F6F0]'}`}
                    aria-pressed={selectedTag === tag}
                  >
                    {tag}
                  </button>
                ))}
                {remainingTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsTagListExpanded((previous) => !previous)}
                    className="snap-item inline-flex shrink-0 px-3 py-2 text-[11px] uppercase tracking-wider border border-white/20 text-[#F9F6F0]/75 hover:border-[#D4AF37] hover:text-[#F9F6F0]"
                    aria-expanded={isTagListExpanded}
                  >
                    {isTagListExpanded ? 'Less' : 'More'}
                  </button>
                )}
                <span aria-hidden="true" className="chip-scroll-spacer" />
              </div>
            </div>
            {isTagListExpanded && remainingTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {remainingTags.map((tag) => (
                  <button
                    key={`extra-${tag}`}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-2 text-[11px] uppercase tracking-wider border ${selectedTag === tag ? 'border-[#D4AF37] bg-[#0B0C0C] text-[#D4AF37]' : 'border-gray-300 text-gray-600 hover:border-[#D4AF37] hover:text-[#0B0C0C]'}`}
                    aria-pressed={selectedTag === tag}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search journal"
              className="w-full md:max-w-sm border border-gray-300 bg-[#F9F6F0] px-4 py-3 text-sm text-[#0B0C0C] outline-none focus:border-[#D4AF37]"
            />
            <p className="text-xs uppercase tracking-wider text-gray-500">{filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {filteredPosts.length ? filteredPosts.map((post) => (
            <article key={post.slug} className="bg-white border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <img
                  src={getBlogImage(post.heroImage)}
                  alt={post.title}
                  loading="lazy"
                  onError={handleBlogImageError}
                  className="w-full h-56 md:h-full object-cover"
                />
                <div className="md:col-span-2 p-6 md:p-8">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • {post.readTime}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-[#0B0C0C] text-[#D4AF37] px-2 py-1">
                        Featured
                      </span>
                    )}
                    {Array.isArray(post.tags) && post.tags.slice(0, 3).map((tag) => (
                      <span key={`${post.slug}-${tag}`} className="text-[10px] uppercase tracking-wider text-gray-600 border border-gray-300 px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-serif text-3xl text-[#0B0C0C] mb-3">{post.title}</h2>
                  <p className="text-gray-700 mb-6">{post.description}</p>
                  <button
                    type="button"
                    onClick={() => openBlogPost(post.slug)}
                    className="bg-[#0B0C0C] text-[#D4AF37] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#1c1c1c]"
                  >
                    Read Article
                  </button>
                </div>
              </div>
            </article>
          )) : (
            <div className="bg-white border border-gray-200 p-8 text-center">
              <p className="text-gray-700">No journal posts match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const renderBlogContent = (content) => {
  if (typeof content !== 'string') return null;
  const trimmedContent = content.trim();
  if (/^\s*</.test(trimmedContent) && /<\/?[a-z][\s\S]*>/i.test(trimmedContent)) {
    return (
      <div
        className="prose prose-slate max-w-none prose-p:text-gray-700 prose-p:leading-8 prose-h2:font-serif prose-h2:text-3xl prose-h2:text-[#0B0C0C] prose-strong:text-[#0B0C0C]"
        dangerouslySetInnerHTML={{ __html: trimmedContent }}
      />
    );
  }

  const nodes = [];
  const lines = content.split('\n');
  let paragraphLines = [];
  let unorderedItems = [];
  let orderedItems = [];
  let keyIndex = 0;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    nodes.push(
      <p key={`blog-p-${keyIndex}`} className="text-gray-700 leading-8 mb-5">
        {paragraphLines.join(' ')}
      </p>,
    );
    keyIndex += 1;
    paragraphLines = [];
  };

  const flushUnordered = () => {
    if (!unorderedItems.length) return;
    nodes.push(
      <ul key={`blog-ul-${keyIndex}`} className="list-disc pl-6 mb-5 space-y-2 text-gray-700">
        {unorderedItems.map((item, index) => (
          <li key={`blog-ul-item-${keyIndex}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    keyIndex += 1;
    unorderedItems = [];
  };

  const flushOrdered = () => {
    if (!orderedItems.length) return;
    nodes.push(
      <ol key={`blog-ol-${keyIndex}`} className="list-decimal pl-6 mb-5 space-y-2 text-gray-700">
        {orderedItems.map((item, index) => (
          <li key={`blog-ol-item-${keyIndex}-${index}`}>{item}</li>
        ))}
      </ol>,
    );
    keyIndex += 1;
    orderedItems = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushUnordered();
      flushOrdered();
      nodes.push(
        <h2 key={`blog-h2-${keyIndex}`} className="font-serif text-3xl text-[#0B0C0C] mt-9 mb-4">
          {trimmed.slice(3)}
        </h2>,
      );
      keyIndex += 1;
      return;
    }

    if (/^-\s+/.test(trimmed)) {
      flushParagraph();
      flushOrdered();
      unorderedItems.push(trimmed.replace(/^-\s+/, ''));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushUnordered();
      orderedItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushUnordered();
    flushOrdered();
    paragraphLines.push(trimmed);
  });

  flushParagraph();
  flushUnordered();
  flushOrdered();
  return nodes;
};

const RitualLetterInline = ({ contextKey = 'journal' }) => {
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (trap) return;

    if (!email.trim() || !isValidEmail(email.trim())) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      await submitFormPayload('newsletter', { email: email.trim() });
      trackEvent('generate_lead', { lead_type: 'newsletter', context: `blog_${contextKey}` });
      setStatus({ type: 'success', message: 'You are subscribed.' });
      setEmail('');
      setTrap('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription failed. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border border-gray-800 bg-[#111111] p-6 md:p-8">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] mb-2">The Ritual Letter</p>
      <h3 className="font-serif text-2xl text-[#F9F6F0] mb-2">Weekly notes from Velure</h3>
      <p className="text-sm text-gray-400 mb-5">Practical brew guides, calm product updates, and clean-label reads.</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={`ritual-letter-${contextKey}`} className="sr-only">Email</label>
          <input
            id={`ritual-letter-${contextKey}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="flex-1 border border-gray-700 bg-[#0B0C0C] px-4 py-3 text-sm text-[#F9F6F0] outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'bg-[#b5952f]/60 text-[#0B0C0C] cursor-not-allowed' : 'bg-[#D4AF37] text-[#0B0C0C] hover:bg-[#b5952f]'}`}
          >
            {isSubmitting ? 'Joining...' : 'Join'}
          </button>
        </div>
        <input
          type="text"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        {status.message && (
          <p className={`mt-3 text-xs ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
};

const BlogPostView = ({ post, onBackToBlog, onOpenProduct, onShopAll }) => {
  const relatedProducts = useMemo(() => getRelatedProductsForBlogPost(post.slug, 3, post.relatedProducts), [post.relatedProducts, post.slug]);

  return (
    <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <button
          type="button"
          onClick={onBackToBlog}
          className="text-xs uppercase tracking-widest text-[#0B0C0C] hover:text-[#D4AF37] mb-6"
        >
          ← Back to Journal
        </button>

        <article className="max-w-3xl mx-auto">
          <img
            src={getBlogImage(post.heroImage)}
            alt={post.title}
            onError={handleBlogImageError}
            className="w-full h-64 md:h-80 object-cover mb-8 border border-gray-200"
          />

          <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
            {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} • {post.readTime}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif text-[#0B0C0C] mb-6">{post.title}</h1>

          <div className="font-sans text-base">
            {renderBlogContent(post.content)}
          </div>

          {Array.isArray(post.supportingImages) && post.supportingImages.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.supportingImages.slice(0, 2).map((image) => (
                <img
                  key={`${post.slug}-${image.src}`}
                  src={getBlogImage(image.src)}
                  alt={image.alt || post.title}
                  loading="lazy"
                  onError={handleBlogImageError}
                  className="w-full h-64 object-cover border border-gray-200"
                />
              ))}
            </div>
          )}

          <RitualLetterInline contextKey={post.slug} />
        </article>

        <div className="mt-14 border border-gray-300 bg-white p-6 md:p-8">
          <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] mb-2">Shop this post</p>
              <h2 className="font-serif text-3xl text-[#0B0C0C]">Continue the ritual</h2>
            </div>
            <button
              type="button"
              onClick={onShopAll}
              className="border border-[#0B0C0C] text-[#0B0C0C] px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Shop all coffee
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={`${post.slug}-${relatedProduct.id}`}
                product={relatedProduct}
                openProductDetail={(selectedProduct) => onOpenProduct(selectedProduct.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ABOUT_PILLARS = [
  {
    title: 'Design + Ritual',
    description: 'Velure is built for calm repetition: clear navigation, intentional product pages, and a morning flow that feels considered on desktop and mobile.',
  },
  {
    title: 'Taste + Craft',
    description: 'We focus on balanced roast profiles, straightforward format choices, and clean brew guidance so each cup feels refined and repeatable.',
  },
  {
    title: 'Transparency',
    description: 'Ingredients, roast details, and product specs are kept visible and factual. No inflated language, no hidden blend storytelling.',
  },
  {
    title: 'Experience',
    description: 'From secure checkout to clear shipping and returns, every step is designed to be readable, dependable, and easy to revisit.',
  },
];

const AboutView = ({ setView }) => (
  <div className="pt-32 pb-24 bg-[#F9F6F0] min-h-screen">
    <div className="max-w-6xl mx-auto px-6">
      <section className="mb-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[#0B0C0C]/70 mb-3">Our Story</p>
        <h1 className="text-4xl md:text-5xl font-serif text-[#0B0C0C] mb-4">Designed for a calmer daily cup</h1>
        <p className="text-gray-700 text-base md:text-lg max-w-3xl leading-relaxed">
          Velure started with a simple intention: make coffee feel premium without overcomplicating the ritual. We focus on clear product details, consistent cup quality, and a composed experience from first browse to checkout.
        </p>
        <div className="max-w-3xl mt-6">
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Velure started with a simple frustration. I&apos;d spent years reaching for coffee that either tasted extraordinary or supported how I wanted to feel — but never both. I wanted something that respected the ritual: a cup that was genuinely single-origin, functionally considered, and worth slowing down for. So I built it. Velure is my answer to a morning that doesn&apos;t compromise — crafted for people who take what they put in their body as seriously as how it tastes.
          </p>
          <p className="text-[13px] text-[#0B0C0C]/55 mt-4">Joe Hart, Founder</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ABOUT_PILLARS.map((pillar) => (
          <article key={pillar.title} className="border border-gray-300 bg-white p-6 md:p-7">
            <div className="w-8 h-px bg-[#D4AF37] mb-4"></div>
            <h2 className="font-serif text-2xl text-[#0B0C0C] mb-3">{pillar.title}</h2>
            <p className="text-gray-700 leading-relaxed">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 bg-[#0B0C0C] border border-[#D4AF37] p-7 md:p-9 text-[#F9F6F0]">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-3">Continue</p>
        <h2 className="font-serif text-3xl mb-4">Explore the Velure collection</h2>
        <p className="text-gray-300 max-w-2xl mb-6">
          Start with full collection browsing or jump directly into functional blends for instant and adaptogenic options.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setView('shop_all')}
            className="bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f]"
          >
            Shop Coffee
          </button>
          <button
            type="button"
            onClick={() => setView('shop_functional')}
            className="border border-[#D4AF37] text-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
          >
            Explore Functional Blends
          </button>
        </div>
      </section>
    </div>
  </div>
);

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

const ShippingReturnsView = () => {
  const blocks = LEGAL_CONTENT.shippingReturns.split('\n\n');
  const lastUpdated = blocks[0] || '';
  const parsedSections = [];

  blocks.slice(1).forEach((block) => {
    const lines = block.split('\n');
    const heading = lines[0] || '';
    const match = heading.match(/^(\d+)\.\s(.+)$/);

    if (match) {
      parsedSections.push({
        number: match[1],
        title: match[2],
        body: lines.slice(1).join('\n'),
        subSections: [],
      });
      return;
    }

    const previousSection = parsedSections[parsedSections.length - 1];
    if (!previousSection) return;

    const suffix = String.fromCharCode(97 + previousSection.subSections.length);
    previousSection.subSections.push({
      number: `${previousSection.number}${suffix}`,
      title: heading.replace(/:$/, ''),
      body: lines.slice(1).join('\n'),
    });
  });

  const sections = parsedSections.map((section) => ({
    ...section,
    id: `shipping-returns-section-${section.number}`,
  }));

  return (
    <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
      <div className="max-w-6xl mx-auto px-6">
        <section className="mb-12 border-b border-gray-800 pb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] mb-3">Shipping &amp; Returns</p>
          <h1 className="text-4xl md:text-5xl font-serif text-[#F9F6F0] mb-4">Shipping &amp; Returns Policy</h1>
          <p className="text-sm text-gray-500">{lastUpdated}</p>
        </section>

        <section className="grid grid-cols-1 gap-5">
          {sections.map((section) => (
            <article
              key={`${section.number}-${section.title}`}
              id={section.id}
              className="border border-gray-800 bg-[#141414] p-6 md:p-7 scroll-mt-36"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <span className="inline-flex min-w-[52px] justify-center border border-[#D4AF37]/35 bg-[#18140c] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                    {section.number}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl text-[#F9F6F0] mb-4">{section.title}</h2>
                  <div className="whitespace-pre-line text-gray-300 leading-relaxed">
                    {section.body}
                  </div>
                  {Array.isArray(section.subSections) && section.subSections.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {section.subSections.map((subSection) => (
                        <div key={`${subSection.number}-${subSection.title}`} className="border-t border-gray-800 pt-5">
                          <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-5">
                            <div className="flex-shrink-0">
                              <span className="inline-flex min-w-[52px] justify-center border border-[#D4AF37]/25 bg-[#15110a] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                                {subSection.number}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-serif text-xl text-[#F9F6F0] mb-3">{subSection.title}</h3>
                              <div className="whitespace-pre-line text-gray-300 leading-relaxed">
                                {subSection.body}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};

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
              <span className="text-[#0B0C0C]">concierge@velurecoffee.com</span>
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

const AccountView = ({
  authState,
  ordersState,
  profileState,
  addressesState,
  onSignIn,
  onSignUp,
  onSignOut,
  onRequestPasswordReset,
  passwordRecovery,
  onCompletePasswordReset,
  onSaveProfile,
  onAddAddress,
  onUpdateAddress,
  onSetDefaultAddress,
  onDeleteAddress,
  setView,
}) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [addressForm, setAddressForm] = useState({ ...DEFAULT_ACCOUNT_ADDRESS_FORM });
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [accountStatus, setAccountStatus] = useState({ type: 'idle', message: '' });
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const savedProfile = profileState?.data || DEFAULT_CUSTOMER_PROFILE;
  const profileForm = profileDraft || profileState?.data || DEFAULT_CUSTOMER_PROFILE;
  const withProfileDraft = (updater) => {
    const base = profileDraft || profileState?.data || DEFAULT_CUSTOMER_PROFILE;
    if (typeof updater === 'function') {
      setProfileDraft(updater(base));
      return;
    }
    setProfileDraft({ ...base, ...(updater || {}) });
  };
  const resetAddressForm = () => {
    setAddressForm({ ...DEFAULT_ACCOUNT_ADDRESS_FORM });
    setEditingAddressId('');
    setIsAddressFormOpen(false);
  };

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

  const handleForgotPassword = async () => {
    const normalizedEmail = normalizeLower(signInForm.email);
    if (!isValidEmail(normalizedEmail)) {
      setStatus({ type: 'error', message: 'Enter your account email first, then select Forgot password.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });
    const result = await onRequestPasswordReset(normalizedEmail);
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    setIsSubmitting(false);
  };

  const handleCompleteReset = async (event) => {
    event.preventDefault();
    if (resetPasswordForm.password.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setStatus({ type: 'error', message: 'Password confirmation does not match.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });
    const result = await onCompletePasswordReset(resetPasswordForm.password);
    setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) {
      setResetPasswordForm({ password: '', confirmPassword: '' });
      setActiveTab('signin');
    }
    setIsSubmitting(false);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setAccountSubmitting(true);
    setAccountStatus({ type: 'idle', message: '' });

    const result = await onSaveProfile({
      ...profileForm,
      fullName: (profileForm.fullName || '').trim(),
      phone: (profileForm.phone || '').trim(),
      marketingPreferences: {
        email: Boolean(profileForm.marketingPreferences?.email),
        sms: Boolean(profileForm.marketingPreferences?.sms),
      },
    });
    setAccountStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) {
      setProfileDraft(null);
      setIsEditingProfile(false);
    }
    setAccountSubmitting(false);
  };

  const handleStartProfileEdit = () => {
    const currentProfile = profileState?.data || DEFAULT_CUSTOMER_PROFILE;
    setProfileDraft({
      ...DEFAULT_CUSTOMER_PROFILE,
      ...currentProfile,
      marketingPreferences: {
        email: Boolean(currentProfile?.marketingPreferences?.email ?? true),
        sms: Boolean(currentProfile?.marketingPreferences?.sms ?? false),
      },
    });
    setIsEditingProfile(true);
    setAccountStatus({ type: 'idle', message: '' });
  };

  const handleCancelProfileEdit = () => {
    setProfileDraft(null);
    setIsEditingProfile(false);
  };

  const handleStartAddAddress = () => {
    setAddressForm({ ...DEFAULT_ACCOUNT_ADDRESS_FORM });
    setEditingAddressId('');
    setIsAddressFormOpen(true);
    setAccountStatus({ type: 'idle', message: '' });
  };

  const handleStartEditAddress = (address) => {
    if (!address?.id) return;
    setAddressForm({
      label: address.label || '',
      recipientName: address.recipientName || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      region: address.region || '',
      postalCode: address.postalCode || '',
      country: address.country || 'US',
      isDefault: Boolean(address.isDefault),
    });
    setEditingAddressId(address.id);
    setIsAddressFormOpen(true);
    setAccountStatus({ type: 'idle', message: '' });
  };

  const handleCancelAddressForm = () => {
    resetAddressForm();
    setAccountStatus({ type: 'idle', message: '' });
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setAccountSubmitting(true);
    setAccountStatus({ type: 'idle', message: '' });

    const result = editingAddressId
      ? await onUpdateAddress(editingAddressId, addressForm)
      : await onAddAddress(addressForm);
    setAccountStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) {
      resetAddressForm();
    }
    setAccountSubmitting(false);
  };

  const handleSetDefault = async (addressId) => {
    setAccountSubmitting(true);
    setAccountStatus({ type: 'idle', message: '' });
    const result = await onSetDefaultAddress(addressId);
    setAccountStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    setAccountSubmitting(false);
  };

  const handleDeleteAddress = async (addressId) => {
    setAccountSubmitting(true);
    setAccountStatus({ type: 'idle', message: '' });
    const result = await onDeleteAddress(addressId);
    setAccountStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    setAccountSubmitting(false);
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

  if (passwordRecovery?.active) {
    return (
      <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-serif mb-6">Reset Password</h1>
          <p className="text-gray-300 mb-8">
            Enter a new password for {passwordRecovery.email || 'your account'}.
          </p>

          <div className="bg-[#151515] border border-gray-800 p-8">
            <form onSubmit={handleCompleteReset} noValidate>
              <div className="space-y-4">
                <input
                  type="password"
                  value={resetPasswordForm.password}
                  onChange={(event) => setResetPasswordForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="New password (min 8 chars)"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(event) => setResetPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Confirm new password"
                  className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-5 bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            {status.message && (
              <p className={`text-sm mt-4 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {status.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (authState.user) {
    return (
      <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-serif mb-6">My Account</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#151515] border border-gray-800 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Signed In</p>
              <p className="text-lg text-[#F9F6F0] break-all">{authState.user.email}</p>
              <p className="text-sm text-gray-400 mt-3">
                Save profile details once and use them across checkout and rewards.
              </p>

              {!isEditingProfile ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Full name:</span>{' '}
                    {savedProfile.fullName || 'Not added yet'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Phone:</span>{' '}
                    {savedProfile.phone || 'Not added yet'}
                  </p>
                  <button
                    type="button"
                    onClick={handleStartProfileEdit}
                    disabled={profileState?.isLoading || accountSubmitting}
                    className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider ${(profileState?.isLoading || accountSubmitting) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                  >
                    {profileState?.isLoading ? 'Loading...' : 'Edit Profile'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="mt-6 space-y-4" noValidate>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(event) => withProfileDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Full name"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(event) => withProfileDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="Phone"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                  />
                  <div className="space-y-2 text-sm text-gray-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(profileForm.marketingPreferences?.email)}
                        onChange={(event) => withProfileDraft((prev) => ({
                          ...prev,
                          marketingPreferences: {
                            email: event.target.checked,
                            sms: Boolean(prev.marketingPreferences?.sms),
                          },
                        }))}
                      />
                      Email marketing updates
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(profileForm.marketingPreferences?.sms)}
                        onChange={(event) => withProfileDraft((prev) => ({
                          ...prev,
                          marketingPreferences: {
                            email: Boolean(prev.marketingPreferences?.email),
                            sms: event.target.checked,
                          },
                        }))}
                      />
                      SMS marketing updates
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={accountSubmitting || profileState?.isLoading}
                      className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider ${(accountSubmitting || profileState?.isLoading) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                    >
                      Save Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProfileEdit}
                      disabled={accountSubmitting}
                      className={`border border-gray-700 text-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-wider ${accountSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-500'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {profileState?.error && (
                <p className="text-sm text-red-400 mt-3">{profileState.error}</p>
              )}
            </div>

            <div className="bg-[#151515] border border-gray-800 p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs uppercase tracking-widest text-gray-400">Saved Addresses</p>
                {!isAddressFormOpen && (
                  <button
                    type="button"
                    onClick={handleStartAddAddress}
                    disabled={accountSubmitting || addressesState?.isLoading}
                    className={`text-xs uppercase tracking-wider px-3 py-2 border border-[#D4AF37] text-[#D4AF37] ${(accountSubmitting || addressesState?.isLoading) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#D4AF37] hover:text-[#0B0C0C]'}`}
                  >
                    Add New Address
                  </button>
                )}
              </div>
              {addressesState?.isLoading ? (
                <p className="text-sm text-gray-400">Loading addresses...</p>
              ) : addressesState?.error ? (
                <p className="text-sm text-red-400">{addressesState.error}</p>
              ) : !addressesState?.items?.length ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">No saved addresses yet.</p>
                  {!isAddressFormOpen && (
                    <button
                      type="button"
                      onClick={handleStartAddAddress}
                      disabled={accountSubmitting}
                      className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider ${accountSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                    >
                      Add Your First Address
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {addressesState.items.map((address) => (
                    <div key={address.id} className="border border-gray-700 p-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-sm text-[#F9F6F0]">
                            {address.label || address.recipientName || 'Address'}
                            {address.isDefault ? <span className="ml-2 text-xs text-[#D4AF37] uppercase tracking-wider">Default</span> : null}
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            {[address.addressLine1, address.addressLine2, `${address.city}, ${address.region} ${address.postalCode}`, address.country]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!address.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(address.id)}
                              className="text-xs text-[#D4AF37] underline underline-offset-2"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditAddress(address)}
                            className="text-xs text-[#D4AF37] underline underline-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-xs text-red-400 underline underline-offset-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isAddressFormOpen && (
                <form onSubmit={handleSaveAddress} className="space-y-3" noValidate>
                  <p className="text-xs uppercase tracking-widest text-gray-500">
                    {editingAddressId ? 'Edit Address' : 'Add Address'}
                  </p>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, label: event.target.value }))}
                    placeholder="Label (Home, Office, etc)"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, recipientName: event.target.value }))}
                    placeholder="Recipient name"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                  />
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                    placeholder="Address line 1"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                    required
                  />
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
                    placeholder="Address line 2 (optional)"
                    className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, city: event.target.value }))}
                      placeholder="City"
                      className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                      required
                    />
                    <input
                      type="text"
                      value={addressForm.region}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, region: event.target.value }))}
                      placeholder="State/Region"
                      className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                      placeholder="Postal code"
                      className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                      required
                    />
                    <input
                      type="text"
                      value={addressForm.country}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, country: event.target.value.toUpperCase() }))}
                      placeholder="Country code (US)"
                      className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                  <label className="text-xs text-gray-400 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                    />
                    Set as default shipping address
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={accountSubmitting}
                      className={`bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider ${accountSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                    >
                      {editingAddressId ? 'Save Address Changes' : 'Add Address'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAddressForm}
                      disabled={accountSubmitting}
                      className={`border border-gray-700 text-gray-300 px-5 py-3 text-xs font-bold uppercase tracking-wider ${accountSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-500'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-[#151515] border border-gray-800 p-6 lg:col-span-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Recent Orders</p>
              {ordersState?.isLoading ? (
                <p className="text-sm text-gray-400">Loading orders...</p>
              ) : ordersState?.error ? (
                <p className="text-sm text-red-400">{ordersState.error}</p>
              ) : !ordersState?.items?.length ? (
                <p className="text-sm text-gray-400">No saved orders yet. Complete checkout while signed in to save orders here.</p>
              ) : (
                <div className="space-y-3">
                  {ordersState.items.slice(0, 5).map((order) => (
                    <div key={order.id || order.payment_intent_id} className="border border-gray-700 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          {order.payment_status || 'unknown'}
                        </p>
                        <p className="text-sm text-[#D4AF37] font-bold">
                          ${(Number(order.total || order.amount_total || 0)).toFixed(2)} {order.currency || 'USD'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{order.item_preview || 'Order items'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {accountStatus.message && (
                <p className={`text-sm mt-4 ${accountStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                  {accountStatus.message}
                </p>
              )}

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
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-[#D4AF37] text-[#0B0C0C] px-6 py-3 text-xs font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                  className={`text-xs uppercase tracking-wider underline underline-offset-2 ${isSubmitting ? 'text-gray-500 cursor-not-allowed' : 'text-[#D4AF37] hover:text-[#F9F6F0]'}`}
                >
                  Forgot password?
                </button>
              </div>
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

  if (!authUser) {
    return (
      <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-5xl font-serif mb-4">Velure Rewards App</h1>
          <p className="text-gray-300 text-lg mb-8">
            Earn something meaningful each time you return to the ritual.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#151515] border border-gray-800 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Earn</p>
              <p className="font-serif text-3xl text-[#D4AF37]">5 points per $1</p>
              <p className="text-sm text-gray-400 mt-3">Every order builds toward something worth using on the next one.</p>
            </div>
            <div className="bg-[#151515] border border-gray-800 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Redeem</p>
              <p className="font-serif text-3xl text-[#D4AF37]">Perks that travel</p>
              <p className="text-sm text-gray-400 mt-3">Redeem for discounts and free shipping when you are ready to use them.</p>
            </div>
            <div className="bg-[#151515] border border-gray-800 p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Join</p>
              <p className="font-serif text-3xl text-[#D4AF37]">Free at checkout</p>
              <p className="text-sm text-gray-400 mt-3">Create your account once, and let each order start earning automatically.</p>
            </div>
          </div>
          <div className="bg-[#151515] border border-gray-800 p-6">
            <p className="text-sm text-gray-300 mb-5">
              Sign in or create an account to unlock points, saved history, and rewards that follow your daily ritual.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setView('account')}
                className="bg-[#D4AF37] text-[#0B0C0C] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#b5952f]"
              >
                Sign In / Sign Up
              </button>
              <button
                type="button"
                onClick={() => setView('shop_all')}
                className="border border-[#D4AF37] text-[#D4AF37] px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#0B0C0C]"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

const SubscriptionView = ({ setView, authUser }) => {
  const subscriptionProducts = getSubscriptionProducts();
  const [customerName, setCustomerName] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState(authUser?.email || '');
  const [selectedProductId, setSelectedProductId] = useState(subscriptionProducts[0]?.id || 'fuse');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const endpoint = import.meta.env.VITE_SUBSCRIPTION_ENDPOINT || '/api/create-subscription-session';

  useEffect(() => {
    setSubscriberEmail(authUser?.email || '');
  }, [authUser?.email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const state = normalizeLower(params.get('subscription'));
    if (state === 'success') {
      setStatus({ type: 'success', message: 'Subscription confirmed. Your next shipment schedule is active.' });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (state === 'cancelled') {
      setStatus({ type: 'error', message: 'Checkout was cancelled. You can restart anytime.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedProductId = normalizeLower(window.localStorage.getItem(SUBSCRIPTION_SELECTION_STORAGE_KEY));
      if (storedProductId && subscriptionProducts.some((product) => product.id === storedProductId)) {
        setSelectedProductId(storedProductId);
      }
      window.localStorage.removeItem(SUBSCRIPTION_SELECTION_STORAGE_KEY);
    } catch {
      // ignore storage access errors
    }
  }, [subscriptionProducts]);

  const selectedProduct = subscriptionProducts.find((product) => product.id === selectedProductId) || subscriptionProducts[0];
  useEffect(() => {
    if (!subscriptionProducts.length) return;
    if (!subscriptionProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(subscriptionProducts[0].id);
    }
  }, [selectedProductId, subscriptionProducts]);
  const basePrice = Number(selectedProduct?.price || 0);
  const membershipRate = getMembershipRateForProduct(selectedProduct);
  const membershipPercent = Math.round(membershipRate * 100);
  const estimatedMonthly = Number((basePrice * quantity * (1 - membershipRate)).toFixed(2));
  const regularMonthly = Number((basePrice * quantity).toFixed(2));

  const handleStartSubscription = async () => {
    const normalizedName = customerName.trim();
    const normalizedEmail = subscriberEmail.trim().toLowerCase();

    if (!normalizedName || normalizedName.length < 2) {
      setStatus({ type: 'error', message: 'Enter your full name.' });
      return;
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          customerName: normalizedName,
          customerEmail: normalizedEmail,
          productId: selectedProductId,
          quantity,
        }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok || !payload?.checkoutUrl) {
        const message = typeof payload?.error === 'string' && payload.error
          ? payload.error
          : 'Unable to start subscription checkout right now.';
        throw new Error(message);
      }

      trackEvent('subscription_checkout_started', {
        product_id: selectedProductId,
        quantity,
      });

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start subscription.';
      setStatus({ type: 'error', message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl sm:text-5xl font-serif text-[#F9F6F0] mb-4">
          Build Your <span className="text-[#D4AF37] italic">Ritual Membership</span>
        </h1>
        <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-3xl">
          Choose your blend, choose your quantity, and lock in recurring deliveries with encrypted Stripe checkout.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <section className="bg-[#151515] border border-gray-800 p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] mb-3">How it works</p>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">1.</span>
                <span>Choose your coffee.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">2.</span>
                <span>Monthly delivery.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold">3.</span>
                <span>Edit or cancel anytime.</span>
              </li>
            </ol>
          </section>

          <section className="bg-[#151515] border border-gray-800 p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] mb-3">Benefits</p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <Check className="text-[#D4AF37] mt-0.5" size={16} />
                <span>Easy changes to blend and quantity.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-[#D4AF37] mt-0.5" size={16} />
                <span>Secure checkout powered by Stripe.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-[#D4AF37] mt-0.5" size={16} />
                <span>Clear subscription terms and controls.</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-6">
          <div className="bg-[#151515] border border-gray-800 p-5 sm:p-6">
            <h2 className="font-serif text-3xl mb-4">Choose Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscriptionProducts.map((product) => {
                const isSelected = product.id === selectedProductId;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`text-left border p-4 transition-colors ${isSelected ? 'border-[#D4AF37] bg-[#0B0C0C]' : 'border-gray-700 hover:border-[#D4AF37]'}`}
                    aria-pressed={isSelected}
                  >
                    {normalizeLower(product.id) === 'zen' && (
                      <span className="inline-flex border border-gray-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300 mb-3">
                        Matcha
                      </span>
                    )}
                    <p className="font-serif text-2xl text-[#F9F6F0]">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{product.subtitle}</p>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mt-3">{getProminentOriginLabel(product)}</p>
                    <p className="text-sm text-[#D4AF37] mt-3">${product.price.toFixed(2)} one-time retail</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border border-gray-700 p-4">
              <label htmlFor="subscription-quantity" className="block text-xs uppercase tracking-widest text-gray-400 mb-3">
                Quantity Per Delivery
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="h-10 w-10 border border-gray-600 text-xl hover:border-[#D4AF37]"
                  aria-label="Decrease subscription quantity"
                >
                  -
                </button>
                <input
                  id="subscription-quantity"
                  type="number"
                  min={1}
                  max={6}
                  value={quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (!Number.isFinite(next)) return;
                    setQuantity(Math.min(6, Math.max(1, Math.round(next))));
                  }}
                  className="w-20 border border-gray-700 bg-[#0B0C0C] p-2 text-center outline-none focus:border-[#D4AF37]"
                />
                <span className="text-sm text-gray-400">bag{quantity > 1 ? 's' : ''} every month</span>
              </div>
            </div>
          </div>

          <div className="bg-[#151515] border border-gray-800 p-5 sm:p-6">
            <h2 className="font-serif text-3xl mb-4">Account & Checkout</h2>
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-widest text-gray-400" htmlFor="subscription-name">Full name</label>
              <input
                id="subscription-name"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
              />

              <label className="block text-xs uppercase tracking-widest text-gray-400 pt-1" htmlFor="subscription-email">Email</label>
              <input
                id="subscription-email"
                type="email"
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-700 bg-[#0B0C0C] p-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="mt-5 border border-gray-700 p-4 bg-[#0B0C0C]">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Estimated Monthly</p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-serif text-4xl text-[#D4AF37]">${estimatedMonthly.toFixed(2)}</p>
                <span className="border border-[#D4AF37]/45 bg-[#1a1408] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                  Save 15%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Regular ${regularMonthly.toFixed(2)} • Ritual Membership {membershipPercent}% preferred pricing</p>
              <p className="text-xs text-gray-400 mt-2">Cancel anytime. Ships every 4 weeks.</p>
              <p className="text-xs text-gray-500 mt-2">
                Secure payment by Stripe. Card details are encrypted and never stored on Velure servers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartSubscription}
              disabled={isSubmitting}
              className={`mt-5 w-full bg-[#D4AF37] text-[#0B0C0C] py-3 font-bold uppercase tracking-wider ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#b5952f]'}`}
            >
              {isSubmitting ? 'Redirecting...' : `Start ${selectedProduct?.name || 'Product'} Subscription`}
            </button>

            {status.message && (
              <p className={`text-sm mt-4 ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {status.message}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-4">
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
          <p className="text-gray-500 text-sm leading-relaxed">Luxury functional coffee. Single-origin beans, adaptogenic blends, crafted for the daily ritual.</p>
        </div>
        <div>
          <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Shop</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><button type="button" onClick={() => setView('shop_all')} className="hover:text-[#F9F6F0]">All Coffee</button></li>
            <li><button type="button" onClick={() => setView('shop_functional')} className="hover:text-[#F9F6F0]">Functional Blends</button></li>
            <li><button type="button" onClick={() => setView('shop_signature')} className="hover:text-[#F9F6F0]">Signature Blends</button></li>
            <li><button type="button" onClick={() => setView('shop_single_origin')} className="hover:text-[#F9F6F0]">Single Origin</button></li>
            <li><button type="button" onClick={() => setView('shop_bundles')} className="hover:text-[#F9F6F0]">Bundles</button></li>
            <li><button type="button" onClick={() => setView('subscription')} className="hover:text-[#F9F6F0]">Subscriptions</button></li>
            <li><button type="button" onClick={() => setView('rewards')} className="hover:text-[#F9F6F0]">Rewards App</button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Company</h3>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><button type="button" onClick={() => setView('about')} className="hover:text-[#F9F6F0]">Our Story</button></li>
            <li><button type="button" onClick={() => setView('blog')} className="hover:text-[#F9F6F0]">Journal</button></li>
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

const HOME_SERIES_TILES = [
  {
    id: 'functional',
    title: 'Functional Blends',
    description: 'Adaptogenic coffee and matcha with transparent ingredient labeling.',
    view: 'shop_functional',
  },
  {
    id: 'single-origin',
    title: 'Single Origin',
    description: 'Origin-led coffees with clear sourcing and a refined cup profile.',
    view: 'shop_single_origin',
  },
  {
    id: 'signature',
    title: 'Signature Blends',
    description: 'Velure house blends designed for balanced, repeatable daily brewing.',
    view: 'shop_signature',
  },
  {
    id: 'bundles',
    title: 'Bundle Sets',
    description: 'Curated multi-item sets prepared for gifting or first-time rituals.',
    view: 'shop_bundles',
  },
];

const getHomeFeaturedProducts = (products, limit = 3) => {
  const explicitlyFeatured = products.filter((product) => product.featuredHome);
  if (explicitlyFeatured.length >= limit) {
    return explicitlyFeatured.slice(0, limit);
  }

  const featuredIds = new Set(explicitlyFeatured.map((product) => product.id));
  const fallbackProducts = products.filter((product) => !featuredIds.has(product.id));
  return [...explicitlyFeatured, ...fallbackProducts].slice(0, limit);
};

const HomeView = ({ openProductDetail, setView }) => {
  const featuredHomeProducts = getHomeFeaturedProducts(getProductsCatalog(), 3);
  const featuredMembershipProduct = getSubscriptionProducts()[0] || null;
  const featuredMembershipPrice = featuredMembershipProduct ? getMembershipPriceForProduct(featuredMembershipProduct) : 0;
  const foundingMemberPrice = featuredMembershipProduct ? getFoundingMemberPriceForProduct(featuredMembershipProduct) : 0;
  const [foundingEmail, setFoundingEmail] = useState('');
  const [foundingStatus, setFoundingStatus] = useState({ type: 'idle', message: '' });
  const [ritualEmail, setRitualEmail] = useState('');
  const [ritualEmailStatus, setRitualEmailStatus] = useState({ type: 'idle', message: '' });

  const handleFoundingMemberSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = foundingEmail.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setFoundingStatus({ type: 'error', message: 'Enter a valid email to reserve your Founding Member note.' });
      return;
    }

    try {
      await submitFormPayload('newsletter', {
        email: normalizedEmail,
        interest: 'founding_member',
      });
      trackEvent('generate_lead', { lead_type: 'founding_member' });
      setFoundingStatus({ type: 'success', message: 'Your Founding Member note is reserved.' });
      setFoundingEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reserve your Founding Member note right now.';
      setFoundingStatus({ type: 'error', message });
    }
  };

  const handleRitualEmailSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = ritualEmail.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setRitualEmailStatus({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }

    try {
      await submitFormPayload('newsletter', { email: normalizedEmail, interest: 'join_the_ritual' });
      trackEvent('generate_lead', { lead_type: 'newsletter_home_midpage' });
      setRitualEmailStatus({ type: 'success', message: 'You are on the list.' });
      setRitualEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to join right now.';
      setRitualEmailStatus({ type: 'error', message });
    }
  };

  return (
    <>
      {/* HERO */}
      <div className="relative min-h-[100svh] w-full flex items-center justify-center overflow-hidden bg-[#0B0C0C]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-[#0B0C0C] z-10"></div>
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url('${HOME_HERO_IMAGE_URL}')` }}
          aria-hidden="true"
        ></div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto motion-enter">
          <p className="text-[#D4AF37] font-sans tracking-[0.3em] text-sm md:text-base mb-6 uppercase">The Standard of Smooth</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#F9F6F0] mb-8 leading-tight">ELEVATE THE <br /><span className="italic text-[#D4AF37]">RITUAL</span></h1>
          <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Single-origin coffee with Lion&apos;s Mane, Chaga &amp; Cordyceps.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => setView('shop_all')} className="bg-[#D4AF37] text-[#0B0C0C] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#b5952f] transition-colors">SHOP COLLECTION</button>
            <button onClick={() => setView('about')} className="border border-[#F9F6F0] text-[#F9F6F0] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#F9F6F0] hover:text-[#0B0C0C] transition-colors">OUR STORY</button>
          </div>
        </div>
      </div>

      <div className="bg-[#0B0C0C] border-y border-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.2em] mb-2">Explore</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#F9F6F0]">Shop by Series</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOME_SERIES_TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => setView(tile.view)}
                className="text-left border border-gray-800 bg-[#121212] p-6 transition-transform duration-200 md:hover:-translate-y-0.5 hover:border-[#D4AF37]/50"
              >
                <div className="w-8 h-px bg-[#D4AF37] mb-4"></div>
                <h3 className="font-serif text-2xl text-[#F9F6F0] mb-3">{tile.title}</h3>
                <p className="font-sans text-sm text-gray-400 leading-relaxed">{tile.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0F0F0F] border-y border-[#2A2418] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.24em] mb-3">Founding Member</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#F9F6F0] leading-tight mb-4">
              Be one of the first 50.
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl leading-relaxed mb-5">
              Get your first Ritual Membership bag at 20% off and lock in that price forever.
            </p>
            {featuredMembershipProduct && (
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Featured ritual</p>
                  <p className="font-serif text-2xl text-[#F9F6F0]">{featuredMembershipProduct.name}</p>
                  <p className="text-sm text-gray-400">{getProminentOriginLabel(featuredMembershipProduct)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500">Founding rate</p>
                  <p className="font-serif text-3xl text-[#D4AF37]">${foundingMemberPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Ongoing Ritual Membership ${featuredMembershipPrice.toFixed(2)} every 4 weeks</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setView('subscription')}
                className="bg-[#D4AF37] text-[#0B0C0C] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#b5952f] transition-colors"
              >
                Claim Founding Rate
              </button>
              <button
                type="button"
                onClick={() => featuredMembershipProduct && openProductDetail(featuredMembershipProduct)}
                className="border border-[#D4AF37] text-[#D4AF37] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-colors"
              >
                View Ritual
              </button>
            </div>
          </div>

          <div className="border border-[#D4AF37]/30 bg-[linear-gradient(160deg,rgba(212,175,55,0.10),rgba(18,18,18,0.96))] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37] mb-3">Reserve the note</p>
            <h3 className="font-serif text-3xl text-[#F9F6F0] mb-3">A quieter way in.</h3>
            <p className="text-gray-300 leading-relaxed mb-5">
              Leave your email for the Founding Member invitation, or step directly into Ritual Membership now.
            </p>
            <form onSubmit={handleFoundingMemberSubmit} className="space-y-3">
              <label htmlFor="founding-email" className="sr-only">Email address</label>
              <input
                id="founding-email"
                type="email"
                value={foundingEmail}
                onChange={(event) => setFoundingEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[#D4AF37]/30 bg-[#0B0C0C] px-4 py-4 text-[#F9F6F0] outline-none focus:border-[#D4AF37]"
              />
              <button type="submit" className="w-full border border-[#F9F6F0] text-[#F9F6F0] px-6 py-4 font-sans font-bold tracking-widest hover:bg-[#F9F6F0] hover:text-[#0B0C0C] transition-colors">
                Reserve Founding Invitation
              </button>
            </form>
            {foundingStatus.message && (
              <p className={`mt-3 text-sm ${foundingStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {foundingStatus.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* VALUE PROPS */}
      <div className="bg-[#F9F6F0] py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Leaf className="text-[#D4AF37]" size={32} /></div>
            <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Ethically Sourced</h3>
            <p className="font-sans text-gray-600">Transparent origin details with a composed, traceable cup profile.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Award className="text-[#D4AF37]" size={32} /></div>
            <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Small Batch Roast</h3>
            <p className="font-sans text-gray-600">Crafted for freshness and consistency.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#0B0C0C] p-4 rounded-full mb-6"><Coffee className="text-[#D4AF37]" size={32} /></div>
            <h3 className="font-serif text-2xl mb-3 text-[#0B0C0C]">Functional Blends</h3>
            <p className="font-sans text-gray-600">Functional blends with transparent ingredients.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] py-20 border-y border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-[#D4AF37] text-xs uppercase tracking-[0.24em] mb-3">Functional Composition</p>
              <h2 className="font-serif text-4xl md:text-5xl text-[#F9F6F0]">Named ingredients. Quiet benefits.</h2>
            </div>
            <p className="max-w-2xl text-gray-400 leading-relaxed">
              Functional ritual should read with clarity. Velure names each ingredient directly and keeps the language warm, restrained, and easy to return to.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['Lion’s Mane', 'Chaga', 'Cordyceps'].map((name) => (
              <div key={name} className="border border-[#D4AF37]/20 bg-[#151515] p-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#D4AF37] mb-2">Ingredient</p>
                <h3 className="font-serif text-3xl text-[#F9F6F0] mb-3">{name}</h3>
                <p className="text-base text-gray-300">{FUNCTIONAL_BENEFIT_COPY[name]}</p>
              </div>
            ))}
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
          <div className="text-center mb-16 motion-enter">
            <h2 className="text-4xl md:text-5xl font-serif text-[#F9F6F0] mb-6">Curated Excellence</h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHomeProducts.map((product) => (
              <ProductCard key={product.id} product={product} openProductDetail={openProductDetail} />
            ))}
          </div>
          <div className="text-center mt-12">
             <button onClick={() => setView('shop_all')} className="border border-[#D4AF37] text-[#D4AF37] px-8 py-3 font-sans uppercase tracking-widest hover:bg-[#D4AF37] hover:text-[#0B0C0C] transition-all">View All</button>
          </div>
        </div>
      </div>

      <div className="bg-[#F5F0E6] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
            <div>
              <p className="text-[#8A6B25] text-xs uppercase tracking-[0.24em] mb-3">Gift The Ritual</p>
              <h2 className="font-serif text-4xl md:text-5xl text-[#0B0C0C]">Luxury, ready to give.</h2>
            </div>
            <p className="max-w-2xl text-gray-700 leading-relaxed">
              Curated for occasion, composed for mornings. Velure gifting is built around intention, not excess.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GIFTING_CURATIONS.map((bundle) => (
              <section key={bundle.title} className="border border-[#D8C7A3] bg-white p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Gift size={18} className="text-[#8A6B25]" />
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8A6B25]">{bundle.subtitle}</p>
                </div>
                <h3 className="font-serif text-3xl text-[#0B0C0C] mb-3">{bundle.title}</h3>
                <p className="text-gray-700 leading-relaxed mb-6">{bundle.description}</p>
                <button
                  type="button"
                  onClick={() => setView(bundle.targetView)}
                  className="border border-[#0B0C0C] text-[#0B0C0C] px-6 py-3 font-sans font-bold tracking-widest hover:bg-[#0B0C0C] hover:text-[#F9F6F0] transition-colors"
                >
                  {bundle.ctaLabel}
                </button>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0B0C0C] py-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[#D4AF37] text-xs uppercase tracking-[0.24em] mb-3">Testimonials</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#F9F6F0]">Voices from the ritual</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOME_TESTIMONIALS.map((item) => (
              <article key={`${item.name}-${item.location}`} className="border border-gray-800 bg-[#141414] p-6 min-h-[260px] flex flex-col">
                <div className="flex items-center gap-1 text-[#D4AF37] mb-5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed flex-1 text-[15px]">{item.review}</p>
                <div className="mt-6 pt-5 border-t border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl text-[#F9F6F0]">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.location}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Verified buyer</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#090909] py-20 border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#D4AF37] text-xs uppercase tracking-[0.24em] mb-3">Join the Ritual</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#F9F6F0] mb-4">Join the Ritual</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Be the first to know about new blends and exclusive drops.
          </p>
          <form onSubmit={handleRitualEmailSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="ritual-email" className="sr-only">Email address</label>
              <input
                id="ritual-email"
                type="email"
                value={ritualEmail}
                onChange={(event) => setRitualEmail(event.target.value)}
                placeholder="you@example.com"
                className="flex-1 border border-gray-700 bg-[#111111] px-5 py-4 text-[#F9F6F0] outline-none focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                className="bg-[#D4AF37] text-[#0B0C0C] px-8 py-4 font-sans font-bold tracking-widest hover:bg-[#b5952f] transition-colors"
              >
                Join
              </button>
            </div>
            {ritualEmailStatus.message && (
              <p className={`mt-4 text-sm ${ritualEmailStatus.type === 'error' ? 'text-red-400' : 'text-green-400'}`} role="status">
                {ritualEmailStatus.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

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

const StorefrontApp = () => {
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return { view: 'home', productId: null, blogSlug: null };
    }

    return getRouteFromPath(window.location.pathname);
  });
  const [, setCatalogRefreshKey] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const currentView = route.view;
  const selectedProduct = currentView === 'product_detail'
    ? getProductsCatalog().find((product) => product.id === route.productId) || null
    : null;
  const selectedBlogPost = currentView === 'blog_post'
    ? getBlogPostBySlug(route.blogSlug)
    : null;

  const navigateToView = useCallback((view, options = {}) => {
    const normalizedView = view === 'product_detail' && !options.productId
      ? 'shop_all'
      : view === 'blog_post' && !options.blogSlug
        ? 'blog'
        : view;
    const productId = options.productId || null;
    const blogSlug = options.blogSlug || null;
    const nextPath = getPathForView(normalizedView, { productId, blogSlug });
    const shouldReplace = options.replace === true;

    if (typeof window !== 'undefined') {
      const historyAction = shouldReplace ? 'replaceState' : 'pushState';
      const nextState = { velureBackGuard: true, view: normalizedView, productId, blogSlug };
      if (window.location.pathname !== nextPath || shouldReplace) {
        window.history[historyAction](nextState, '', nextPath);
      }

      if (!options.preserveScroll) {
        window.scrollTo(0, 0);
      }
    }

    setRoute({ view: normalizedView, productId, blogSlug });
  }, []);

  const setView = useCallback((view) => {
    trackEvent('navigation_click', { destination: view });
    navigateToView(view);
  }, [navigateToView]);

  const openSubscriptionForProduct = useCallback((productId) => {
    try {
      if (typeof window !== 'undefined') {
        const normalizedProductId = normalizeLower(productId);
        if (getSubscriptionProducts().some((product) => product.id === normalizedProductId)) {
          window.localStorage.setItem(SUBSCRIPTION_SELECTION_STORAGE_KEY, normalizedProductId);
        } else {
          window.localStorage.removeItem(SUBSCRIPTION_SELECTION_STORAGE_KEY);
        }
      }
    } catch {
      // ignore storage access errors
    }
    trackEvent('navigation_click', { destination: 'subscription', product_id: normalizeLower(productId) || undefined });
    navigateToView('subscription');
  }, [navigateToView]);

  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadStorefrontContent = async () => {
      try {
        const [productsResponse, blogResponse] = await Promise.all([
          fetch('/api/public-products', { credentials: 'same-origin' }),
          fetch('/api/public-blog-posts', { credentials: 'same-origin' }),
        ]);

        if (!productsResponse.ok || !blogResponse.ok) {
          throw new Error('Unable to refresh storefront content.');
        }

        const [productsPayload, blogPayload] = await Promise.all([
          productsResponse.json().catch(() => null),
          blogResponse.json().catch(() => null),
        ]);

        if (cancelled) return;

        if (Array.isArray(productsPayload?.products) && productsPayload.products.length > 0) {
          setProductsCatalog(productsPayload.products.map(normalizeSupabaseProduct));
        } else {
          setProductsCatalog(PRODUCTS);
        }
        if (Array.isArray(blogPayload?.posts) && blogPayload.posts.length > 0) {
          setBlogPostsCatalog(blogPayload.posts.map(normalizeSupabaseBlogPost));
        } else {
          setBlogPostsCatalog(BLOG_POSTS);
        }
        setCatalogRefreshKey((previous) => previous + 1);
      } catch (error) {
        console.error('Storefront content refresh failed:', error);
        if (cancelled) return;
        setProductsCatalog(PRODUCTS);
        setBlogPostsCatalog(BLOG_POSTS);
        setCatalogRefreshKey((previous) => previous + 1);
      }
    };

    loadStorefrontContent();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const [authState, setAuthState] = useState({ ...DEFAULT_AUTH_STATE });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [ordersState, setOrdersState] = useState({
    isLoading: false,
    error: '',
    items: [],
  });
  const [profileState, setProfileState] = useState({
    isLoading: false,
    error: '',
    data: { ...DEFAULT_CUSTOMER_PROFILE },
  });
  const [addressesState, setAddressesState] = useState({
    isLoading: false,
    error: '',
    items: [],
  });
  const [passwordRecovery, setPasswordRecovery] = useState({ ...DEFAULT_PASSWORD_RECOVERY_STATE });

  useEffect(() => {
    let isMounted = true;

    const applySession = (sessionPayload) => {
      if (!isMounted) return;
      const mapped = mapSupabaseSessionToAuthState(sessionPayload);
      setAuthState({
        isLoading: false,
        user: mapped.user,
        session: mapped.session,
      });
    };

    const loadSession = async () => {
      setAuthState((previousState) => ({ ...previousState, isLoading: true }));
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error('Failed to hydrate auth session', error);
        setAuthState({
          isLoading: false,
          user: null,
          session: null,
        });
        return;
      }

      applySession(data?.session || null);
    };

    loadSession();

    const { data: listenerData } = supabase.auth.onAuthStateChange((event, sessionPayload) => {
      applySession(sessionPayload || null);

      if (event === 'SIGNED_IN') {
        setIsAuthModalOpen(false);
      }

      if (event === 'SIGNED_OUT') {
        setPasswordRecovery({ ...DEFAULT_PASSWORD_RECOVERY_STATE });
      }

      if (event === 'PASSWORD_RECOVERY') {
        const recoverSessionToken = typeof sessionPayload?.access_token === 'string'
          ? sessionPayload.access_token
          : '';
        const recoverEmail = normalizeLower(sessionPayload?.user?.email || '');
        setPasswordRecovery({
          active: true,
          accessToken: recoverSessionToken,
          email: recoverEmail,
        });
        navigateToView('account', { replace: true, preserveScroll: true });
        trackEvent('password_recovery_opened');
      }
    });

    return () => {
      isMounted = false;
      listenerData?.subscription?.unsubscribe?.();
    };
  }, [navigateToView]);

  useEffect(() => {
    if (authState.isLoading) return;
    if (currentView !== 'account') return;
    if (authState.user?.id || passwordRecovery.active) return;

    setIsAuthModalOpen(true);
    navigateToView('home', { replace: true, preserveScroll: true });
  }, [authState.isLoading, authState.user?.id, currentView, navigateToView, passwordRecovery.active]);

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
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      setCart(normalizeCartItems(parsedCart));
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
      localStorage.setItem(cartStorageKey, JSON.stringify(normalizeCartItems(cart)));
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
    let cancelled = false;
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;

    if (!accessToken || !userId) {
      setOrdersState({ isLoading: false, error: '', items: [] });
      return undefined;
    }

    const loadOrders = async () => {
      setOrdersState((previous) => ({ ...previous, isLoading: true, error: '' }));
      try {
        const payload = await loadOrdersFromApi(accessToken, 20);
        if (cancelled) return;
        const items = Array.isArray(payload?.orders) ? payload.orders : [];
        setOrdersState({ isLoading: false, error: '', items });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load account orders.';
        setOrdersState({ isLoading: false, error: message, items: [] });
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [authState.session?.accessToken, authState.user?.id, currentView]);

  useEffect(() => {
    let cancelled = false;
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;

    if (!accessToken || !userId) {
      setProfileState({ isLoading: false, error: '', data: { ...DEFAULT_CUSTOMER_PROFILE } });
      return undefined;
    }

    const loadProfile = async () => {
      setProfileState((previous) => ({ ...previous, isLoading: true, error: '' }));
      try {
        const payload = await loadCustomerProfileFromApi(accessToken);
        if (cancelled) return;
        const profile = payload?.profile && typeof payload.profile === 'object'
          ? {
              ...DEFAULT_CUSTOMER_PROFILE,
              ...payload.profile,
              marketingPreferences: {
                email: Boolean(payload.profile?.marketingPreferences?.email ?? true),
                sms: Boolean(payload.profile?.marketingPreferences?.sms ?? false),
              },
            }
          : { ...DEFAULT_CUSTOMER_PROFILE };
        setProfileState({ isLoading: false, error: '', data: profile });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load customer profile.';
        setProfileState({ isLoading: false, error: message, data: { ...DEFAULT_CUSTOMER_PROFILE } });
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [authState.session?.accessToken, authState.user?.id, currentView]);

  useEffect(() => {
    let cancelled = false;
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;

    if (!accessToken || !userId) {
      setAddressesState({ isLoading: false, error: '', items: [] });
      return undefined;
    }

    const loadAddresses = async () => {
      setAddressesState((previous) => ({ ...previous, isLoading: true, error: '' }));
      try {
        const payload = await loadCustomerAddressesFromApi(accessToken, 50);
        if (cancelled) return;
        const items = Array.isArray(payload?.addresses) ? payload.addresses : [];
        setAddressesState({ isLoading: false, error: '', items });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load customer addresses.';
        setAddressesState({ isLoading: false, error: message, items: [] });
      }
    };

    loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [authState.session?.accessToken, authState.user?.id, currentView]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const currentPath = window.location.pathname !== '/' ? window.location.pathname.replace(/\/+$/, '') : '/';
    const hasBackGuard = window.history.state?.velureBackGuard;

    if (!hasBackGuard) {
      if (currentPath !== ROUTE_PATHS.home) {
        const initialRoute = getRouteFromPath(currentPath);
        window.history.replaceState({ velureBackGuard: true, view: 'home' }, '', ROUTE_PATHS.home);
        window.history.pushState(
          {
            velureBackGuard: true,
            view: initialRoute.view,
            productId: initialRoute.productId,
            blogSlug: initialRoute.blogSlug,
          },
          '',
          getPathForView(initialRoute.view, { productId: initialRoute.productId, blogSlug: initialRoute.blogSlug })
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
      : getPathForView(currentView, { productId: route.productId, blogSlug: route.blogSlug });

    trackEvent('page_view', {
      path,
      view: currentView,
      ...(route.productId ? { product_id: route.productId } : {}),
      ...(route.blogSlug ? { blog_slug: route.blogSlug } : {}),
    });
  }, [currentView, route.blogSlug, route.productId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const path = window.location.pathname;
    const canonical = `${origin}${path}`;
    const defaultImage = DEFAULT_SHARE_IMAGE_URL;

    const viewMeta = {
      home: {
        title: 'Velure Coffee | Elevate the Ritual',
        description: 'Elevate your ritual with Velure. Premium coffee, functional blends, and ceremonial matcha.',
      },
      shop_all: {
        title: 'Velure Coffee | Shop All',
        description: 'Browse all Velure coffee collections, including functional blends, signature blends, and single-origin favorites.',
      },
      shop_functional: {
        title: 'Functional Blends | Velure Coffee',
        description: 'Explore Velure functional coffee blends with purposeful ingredients for daily focus and energy.',
      },
      shop_signature: {
        title: 'Signature Blends | Velure Coffee',
        description: 'Explore Velure signature blends and pods crafted for balanced flavor and daily ritual consistency.',
      },
      shop_single_origin: {
        title: 'Single Origin Series | Velure Coffee',
        description: 'Discover Velure single-origin coffee with distinct regional profiles and premium quality.',
      },
      shop_bundles: {
        title: 'Velure Coffee | Bundle Sets',
        description: 'Shop curated Velure bundle sets for bright, dark, and starter coffee rituals.',
      },
      blog: {
        title: 'Velure Coffee | Journal',
        description: 'Calm, factual coffee guides on Lion’s Mane blends, clean-label coffee, and brewing better cups.',
      },
      blog_post: {
        title: 'Journal | Velure Coffee',
        description: 'Read premium coffee education and practical brewing guides from Velure.',
      },
      checkout: {
        title: 'Checkout | Velure Coffee',
        description: 'Secure Stripe checkout for your Velure order.',
      },
      rewards: {
        title: 'Rewards App | Velure Coffee',
        description: 'Earn points, unlock discounts, and redeem free-shipping rewards with the Velure rewards flow.',
      },
      about: {
        title: 'Velure Coffee | Our Story',
        description: 'Learn why Velure was started and how we shape a calmer, more intentional coffee ritual.',
      },
      subscription: {
        title: 'Velure Coffee | Ritual Membership',
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
        sku: selectedProduct.id,
        category: CATEGORY_LABELS[selectedProduct.category] || 'Coffee',
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
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Velure Coffee',
          },
        },
      };
    }

    if (currentView === 'blog_post' && selectedBlogPost) {
      title = selectedBlogPost.metaTitle || `${selectedBlogPost.title} | Velure Journal`;
      description = selectedBlogPost.metaDescription || selectedBlogPost.description || activeMeta.description;
      image = selectedBlogPost.heroImage || defaultImage;
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: selectedBlogPost.title,
        description,
        image: [image],
        mainEntityOfPage: canonical,
        datePublished: selectedBlogPost.publishedAt,
        dateModified: selectedBlogPost.publishedAt,
        keywords: Array.isArray(selectedBlogPost.tags) ? selectedBlogPost.tags.join(', ') : undefined,
        author: {
          '@type': 'Organization',
          name: 'Velure Coffee',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Velure Coffee',
          logo: {
            '@type': 'ImageObject',
            url: defaultImage,
          },
        },
      };
    }

    document.title = title;
    upsertMetaByName('description', description);
    upsertMetaByProperty('og:type', currentView === 'product_detail' ? 'product' : 'website');
    upsertMetaByProperty('og:title', title);
    upsertMetaByProperty('og:description', description);
    upsertMetaByProperty('og:url', canonical);
    upsertMetaByProperty('og:image', image);
    upsertMetaByProperty('og:image:alt', currentView === 'product_detail' && selectedProduct ? `${selectedProduct.name} by Velure Coffee` : 'Velure Coffee brand preview');
    upsertMetaByProperty('twitter:card', 'summary_large_image');
    upsertMetaByProperty('twitter:url', canonical);
    upsertMetaByProperty('twitter:title', title);
    upsertMetaByProperty('twitter:description', description);
    upsertMetaByProperty('twitter:image', image);
    upsertCanonical(canonical);
    upsertStructuredData(structuredData);
  }, [currentView, selectedBlogPost, selectedProduct]);

  const addToCart = (product, quantity = 1, options = {}) => {
    const safeQuantity = clampCartQty(quantity);
    const normalizedBundleSelection = sanitizeBundleSelection(options?.bundleSelection);

    setCart((previousCart) => {
      const normalizedItems = normalizeCartItems(previousCart);
      const existingIndex = normalizedItems.findIndex((item) => item.productId === product.id);

      if (existingIndex === -1) {
        return [
          ...normalizedItems,
          {
            productId: product.id,
            quantity: safeQuantity,
            ...(normalizedBundleSelection ? { bundleSelection: normalizedBundleSelection } : {}),
          },
        ];
      }

      const updatedItems = [...normalizedItems];
      const existingItem = updatedItems[existingIndex];
      updatedItems[existingIndex] = {
        ...existingItem,
        quantity: clampCartQty(existingItem.quantity + safeQuantity),
        ...(normalizedBundleSelection ? { bundleSelection: normalizedBundleSelection } : {}),
      };
      return updatedItems;
    });

    openCart();
    trackEvent('add_to_cart', {
      currency: 'USD',
      value: Number((product.price * safeQuantity).toFixed(2)),
      item_id: product.id,
      item_name: product.name,
      quantity: safeQuantity,
      ...(normalizedBundleSelection?.slots?.length ? { bundle_slot_count: normalizedBundleSelection.slots.length } : {}),
    });
  };

  const setCartItemQty = useCallback((productId, quantity) => {
    const normalizedProductId = normalizeLower(productId);
    setCart((previousCart) => {
      const normalizedItems = normalizeCartItems(previousCart);
      const nextQty = clampCartQty(quantity);
      return normalizedItems.map((item) => {
        if (item.productId !== normalizedProductId) {
          return item;
        }
        return { ...item, quantity: nextQty };
      });
    });
  }, []);

  const incrementCartItemQty = useCallback((productId) => {
    setCart((previousCart) => {
      const normalizedItems = normalizeCartItems(previousCart);
      return normalizedItems.map((item) => {
        if (item.productId !== normalizeLower(productId)) {
          return item;
        }
        return { ...item, quantity: clampCartQty(item.quantity + 1) };
      });
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    const normalizedProductId = normalizeLower(productId);
    const removedProduct = getProductById(normalizedProductId);

    setCart((previousCart) => {
      return normalizeCartItems(previousCart).filter((item) => item.productId !== normalizedProductId);
    });

    if (removedProduct) {
      trackEvent('remove_from_cart', {
        currency: 'USD',
        value: Number(removedProduct.price.toFixed(2)),
        item_id: removedProduct.id,
        item_name: removedProduct.name,
      });
    }
  }, []);

  const decrementCartItemQty = useCallback((productId) => {
    const normalizedProductId = normalizeLower(productId);
    setCart((previousCart) => {
      const normalizedItems = normalizeCartItems(previousCart);
      return normalizedItems.reduce((nextItems, item) => {
        if (item.productId !== normalizedProductId) {
          nextItems.push(item);
          return nextItems;
        }

        const nextQty = item.quantity - 1;
        if (nextQty > 0) {
          nextItems.push({ ...item, quantity: nextQty });
        }
        return nextItems;
      }, []);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const proceedToCheckout = useCallback(() => {
    if (cart.length === 0) return;

    const subtotal = getCartSubtotal(cart);
    const totalQuantity = getCartTotalQuantity(cart);
    const activeRewardId = authState.user ? rewardsProfile.activeRewardId : null;
    const pricing = getCheckoutPricing(subtotal, activeRewardId);

    trackEvent('begin_checkout', {
      currency: 'USD',
      value: Number(pricing.total.toFixed(2)),
      item_count: totalQuantity,
      reward_id: activeRewardId || undefined,
    });

    closeCart();
    if (typeof window !== 'undefined') {
      window.location.assign('/checkout.html');
      return;
    }
    navigateToView('checkout');
  }, [authState.user, cart, closeCart, navigateToView, rewardsProfile.activeRewardId]);

  const openProductDetail = useCallback((product) => {
    navigateToView('product_detail', { productId: product.id });
    trackEvent('view_item', {
      currency: 'USD',
      value: Number(product.price.toFixed(2)),
      item_id: product.id,
      item_name: product.name,
    });
  }, [navigateToView]);

  const openBlogPost = useCallback((blogSlug) => {
    if (!blogSlug) return;
    navigateToView('blog_post', { blogSlug });
    trackEvent('select_content', {
      content_type: 'blog_post',
      item_id: blogSlug,
    });
  }, [navigateToView]);

  const openBlogRelatedProduct = useCallback((productId) => {
    const product = getProductsCatalog().find((entry) => entry.id === productId);
    if (!product) return;
    openProductDetail(product);
  }, [openProductDetail]);

  const handleSignIn = useCallback(async (email, password) => {
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      const normalizedEmail = normalizeLower(email);
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        throw error;
      }

      trackEvent('login', { method: 'password' });
      return { ok: true, message: 'Signed in successfully.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      return { ok: false, message };
    }
  }, []);

  const handleMagicLinkSignIn = useCallback(async (email) => {
    const normalizedEmail = normalizeLower(email);
    if (!isValidEmail(normalizedEmail)) {
      return { ok: false, message: 'Enter a valid account email.' };
    }

    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      trackEvent('login', { method: 'magic_link' });
      return { ok: true, message: 'Magic link sent. Check your inbox and spam folder.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send magic link right now.';
      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      return { ok: false, message };
    }
  }, []);

  const handleSignUp = useCallback(async (email, password) => {
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      const normalizedEmail = normalizeLower(email);
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        throw error;
      }

      if (data?.session?.access_token) {
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
    setAuthState((previousState) => ({ ...previousState, isLoading: true }));

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign-out request failed', error);
    } finally {
      setAuthState({
        isLoading: false,
        user: null,
        session: null,
      });
      setPasswordRecovery({ ...DEFAULT_PASSWORD_RECOVERY_STATE });
      setIsAuthModalOpen(false);
      trackEvent('logout');
      navigateToView('home', { replace: true });
    }
  }, [navigateToView]);

  const handleRequestPasswordReset = useCallback(async (email) => {
    const normalizedEmail = normalizeLower(email);
    if (!isValidEmail(normalizedEmail)) {
      return { ok: false, message: 'Enter a valid account email.' };
    }

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/update-password` : '';
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) {
        throw error;
      }
      trackEvent('password_reset_requested', { email: normalizedEmail });
      return {
        ok: true,
        message: 'Password reset email sent. Check inbox and spam, then open the link to set a new password.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send password reset email right now.';
      return { ok: false, message };
    }
  }, []);

  const handleCompletePasswordReset = useCallback(async (nextPassword) => {
    if (nextPassword.length < 8) {
      return { ok: false, message: 'New password must be at least 8 characters.' };
    }
    if (!passwordRecovery.accessToken) {
      return { ok: false, message: 'Recovery session expired. Request another reset email.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) {
        throw error;
      }
      setPasswordRecovery({ ...DEFAULT_PASSWORD_RECOVERY_STATE });
      setAuthState((previousState) => ({ ...previousState, isLoading: false }));
      navigateToView('account', { replace: true, preserveScroll: true });
      trackEvent('password_reset_completed');
      return { ok: true, message: 'Password updated. Sign in with your new password.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update password right now.';
      return { ok: false, message };
    }
  }, [navigateToView, passwordRecovery.accessToken]);

  const handleSaveCustomerProfile = useCallback(async (profileInput) => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;
    if (!accessToken || !userId) {
      return { ok: false, message: 'Sign in to update your profile.' };
    }

    try {
      const payload = await saveCustomerProfileToApi(accessToken, profileInput);
      const nextProfile = payload?.profile && typeof payload.profile === 'object'
        ? {
            ...DEFAULT_CUSTOMER_PROFILE,
            ...payload.profile,
            marketingPreferences: {
              email: Boolean(payload.profile?.marketingPreferences?.email ?? true),
              sms: Boolean(payload.profile?.marketingPreferences?.sms ?? false),
            },
          }
        : {
            ...DEFAULT_CUSTOMER_PROFILE,
            ...profileInput,
          };
      setProfileState({ isLoading: false, error: '', data: nextProfile });
      return { ok: true, message: 'Profile saved.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save profile right now.';
      return { ok: false, message };
    }
  }, [authState.session?.accessToken, authState.user?.id]);

  const handleAddCustomerAddress = useCallback(async (addressInput) => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;
    if (!accessToken || !userId) {
      return { ok: false, message: 'Sign in to save addresses.' };
    }

    try {
      await createCustomerAddressInApi(accessToken, addressInput);
      const refreshed = await loadCustomerAddressesFromApi(accessToken, 50);
      const items = Array.isArray(refreshed?.addresses) ? refreshed.addresses : [];
      setAddressesState({ isLoading: false, error: '', items });
      return { ok: true, message: 'Address saved.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save address right now.';
      return { ok: false, message };
    }
  }, [authState.session?.accessToken, authState.user?.id]);

  const handleUpdateCustomerAddress = useCallback(async (addressId, addressInput) => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;
    if (!accessToken || !userId) {
      return { ok: false, message: 'Sign in to manage addresses.' };
    }

    try {
      await updateCustomerAddressInApi(accessToken, addressId, addressInput);
      const refreshed = await loadCustomerAddressesFromApi(accessToken, 50);
      const items = Array.isArray(refreshed?.addresses) ? refreshed.addresses : [];
      setAddressesState({ isLoading: false, error: '', items });
      return { ok: true, message: 'Address updated.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update address right now.';
      return { ok: false, message };
    }
  }, [authState.session?.accessToken, authState.user?.id]);

  const handleSetDefaultCustomerAddress = useCallback(async (addressId) => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;
    if (!accessToken || !userId) {
      return { ok: false, message: 'Sign in to manage addresses.' };
    }

    try {
      const currentAddress = addressesState.items.find((item) => item.id === addressId);
      if (!currentAddress) {
        return { ok: false, message: 'Address not found.' };
      }
      await updateCustomerAddressInApi(accessToken, addressId, {
        ...currentAddress,
        isDefault: true,
      });
      const refreshed = await loadCustomerAddressesFromApi(accessToken, 50);
      const items = Array.isArray(refreshed?.addresses) ? refreshed.addresses : [];
      setAddressesState({ isLoading: false, error: '', items });
      return { ok: true, message: 'Default address updated.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to set default address.';
      return { ok: false, message };
    }
  }, [addressesState.items, authState.session?.accessToken, authState.user?.id]);

  const handleDeleteCustomerAddress = useCallback(async (addressId) => {
    const accessToken = authState.session?.accessToken;
    const userId = authState.user?.id;
    if (!accessToken || !userId) {
      return { ok: false, message: 'Sign in to manage addresses.' };
    }

    try {
      await deleteCustomerAddressInApi(accessToken, addressId);
      const refreshed = await loadCustomerAddressesFromApi(accessToken, 50);
      const items = Array.isArray(refreshed?.addresses) ? refreshed.addresses : [];
      setAddressesState({ isLoading: false, error: '', items });
      return { ok: true, message: 'Address deleted.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete address.';
      return { ok: false, message };
    }
  }, [authState.session?.accessToken, authState.user?.id]);

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
    if (!authState.user?.id) {
      return { ok: false, message: 'Sign in to redeem account rewards.' };
    }

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
  }, [authState.user?.id]);

  const removeReward = useCallback(() => {
    if (!authState.user?.id) {
      return { ok: false, message: 'Sign in to manage account rewards.' };
    }

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
  }, [authState.user?.id]);

  const handleCheckoutSuccess = useCallback((checkoutPayload) => {
    if (!authState.user?.id) {
      setCart([]);
      return;
    }

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
  }, [authState.user?.id]);

  const cartCount = getCartTotalQuantity(cart);

  // --- CONTENT MAPPING ---
  
  const renderView = () => {
    if (currentView === 'product_detail' && selectedProduct) {
      return (
        <ProductDetailView 
          key={selectedProduct.id}
          product={selectedProduct} 
          addToCart={addToCart} 
          onBack={() => setView('shop_all')}
          onOpenSubscription={openSubscriptionForProduct}
          isCartOpen={isCartOpen}
          onShareProduct={handleShareProduct}
          onCopyProductLink={handleCopyProductLink}
          authUser={authState.user}
          authAccessToken={authState.session?.accessToken || ''}
          onOpenAccount={() => {
            if (authState.user) {
              setView('account');
              return;
            }
            setIsAuthModalOpen(true);
          }}
        />
      );
    }

    if (currentView === 'blog_post' && selectedBlogPost) {
      return (
        <BlogPostView
          post={selectedBlogPost}
          onBackToBlog={() => setView('blog')}
          onOpenProduct={openBlogRelatedProduct}
          onShopAll={() => setView('shop_all')}
        />
      );
    }

    switch (currentView) {
      case 'home': return <HomeView openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_all': return <ShopView key="shop-all" category="all" openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_functional': return <ShopView key="shop-functional" category="functional" openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_signature': return <ShopView key="shop-signature" category="signature" openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_single_origin': return <ShopView key="shop-single-origin" category="single_origin" openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_bundles': return <ShopView key="shop-bundles" category="bundles" openProductDetail={openProductDetail} setView={setView} />;
      case 'blog': return <BlogView openBlogPost={openBlogPost} />;
      case 'checkout': return (
        <CheckoutView
          cart={cart}
          rewardsProfile={rewardsProfile}
          authUser={authState.user}
          authAccessToken={authState.session?.accessToken || ''}
          setView={setView}
          onOpenCart={openCart}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onRemoveReward={removeReward}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      );
      case 'contact': return <ContactView />;
      case 'account': return (
        <AccountView
          authState={authState}
          ordersState={ordersState}
          profileState={profileState}
          addressesState={addressesState}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onSignOut={handleSignOut}
          onRequestPasswordReset={handleRequestPasswordReset}
          passwordRecovery={passwordRecovery}
          onCompletePasswordReset={handleCompletePasswordReset}
          onSaveProfile={handleSaveCustomerProfile}
          onAddAddress={handleAddCustomerAddress}
          onUpdateAddress={handleUpdateCustomerAddress}
          onSetDefaultAddress={handleSetDefaultCustomerAddress}
          onDeleteAddress={handleDeleteCustomerAddress}
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
      case 'subscription': return <SubscriptionView setView={setView} authUser={authState.user} />;
      case 'product_detail': return <ShopView category="all" openProductDetail={openProductDetail} setView={setView} />;
      case 'blog_post': return <BlogView openBlogPost={openBlogPost} />;
      
      case 'about': return <AboutView setView={setView} />;

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
        <ShippingReturnsView />
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
        cartCount={cartCount}
        setView={setView}
        toggleCart={openCart}
        authUser={authState.user}
        onSignOut={handleSignOut}
        onSharePage={handleSharePage}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onPasswordSignIn={handleSignIn}
          onMagicLinkSignIn={handleMagicLinkSignIn}
          onSignUp={handleSignUp}
          onForgotPassword={handleRequestPasswordReset}
        />
      )}
      
      <CartDrawer 
        isOpen={isCartOpen} 
        closeCart={closeCart} 
        cart={cart} 
        removeFromCart={removeFromCart}
        decrementCartItemQty={decrementCartItemQty}
        incrementCartItemQty={incrementCartItemQty}
        setCartItemQty={setCartItemQty}
        clearCart={clearCart}
        rewardsProfile={rewardsProfile}
        authUser={authState.user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

const App = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return <StorefrontApp />;
};

export default App;
