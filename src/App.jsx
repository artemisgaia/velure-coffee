import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Star, Coffee, Leaf, Award, Check, Trash2, Mail, MapPin, Phone, ArrowLeft } from 'lucide-react';

// --- BRAND ASSETS & DATA ---

// Replace with your actual PayPal Merchant ID or Email
const PAYPAL_EMAIL = "sales@artemisgaia.co"; 

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
    }
  }
];

// --- SUB-COMPONENTS ---

const ProductCard = ({ product, openProductDetail }) => (
  <div className="group cursor-pointer" onClick={() => openProductDetail(product)}>
    <div className="relative overflow-hidden bg-[#1A1A1A] aspect-[4/5] mb-6">
      <img src={product.images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
      <div className="absolute top-4 left-4 bg-[#D4AF37] text-[#0B0C0C] text-xs font-bold px-3 py-1 uppercase tracking-wider">{product.tag}</div>
      <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <button className="w-full bg-[#F9F6F0] text-[#0B0C0C] py-3 font-sans font-bold tracking-wider hover:bg-[#D4AF37] transition-colors shadow-lg">
          VIEW RITUAL
        </button>
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-[#F9F6F0] font-serif text-2xl mb-1">{product.name}</h3>
      <p className="text-gray-400 font-sans text-sm mb-2">{product.subtitle}</p>
      <div className="flex justify-center mb-2">
          {[...Array(5)].map((_, i) => (
             <Star key={i} size={12} fill={i < product.rating ? "#D4AF37" : "none"} color={i < product.rating ? "#D4AF37" : "#4b5563"} />
          ))}
      </div>
      <p className="text-[#F9F6F0] font-sans font-medium">${product.price.toFixed(2)}</p>
    </div>
  </div>
);

const ProductDetailView = ({ product, addToCart, onBack }) => {
  const [mainImage, setMainImage] = useState(product.images[0]);

  useEffect(() => {
    window.scrollTo(0,0);
  }, [product]);

  return (
    <div className="bg-[#0B0C0C] min-h-screen pt-32 pb-24 text-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={onBack} className="flex items-center text-[#D4AF37] mb-8 hover:text-[#F9F6F0] transition-colors font-sans text-sm tracking-widest uppercase">
          <ArrowLeft size={16} className="mr-2" /> Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Section */}
          <div className="flex flex-col gap-6">
            <div className="w-full aspect-[4/5] bg-[#1a1a1a] relative overflow-hidden">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${mainImage === img ? 'border-[#D4AF37]' : 'border-transparent'} hover:border-[#D4AF37]`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div>
            <span className="text-[#D4AF37] font-sans tracking-[0.2em] text-xs uppercase mb-2 block">{product.category.replace('_', ' ')} Series</span>
            <h1 className="text-5xl md:text-6xl font-serif text-[#F9F6F0] mb-4">{product.name}</h1>
            <p className="text-xl text-gray-400 font-sans mb-6">{product.subtitle}</p>
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-8">
              <span className="text-3xl font-serif text-[#D4AF37]">${product.price.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < product.rating ? "#D4AF37" : "none"} color={i < product.rating ? "#D4AF37" : "#4b5563"} />
                ))}
                <span className="text-sm text-gray-500 ml-2">({product.reviews} Reviews)</span>
              </div>
            </div>

            <p className="text-gray-300 font-sans leading-relaxed mb-8 whitespace-pre-line">
              {product.description}
            </p>

            <div className="bg-[#151515] p-6 mb-8 border border-gray-800">
              <h3 className="font-serif text-[#D4AF37] mb-4">The Details</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-sans">
                <li className="flex justify-between border-b border-gray-800 pb-2"><span>Origin</span> <span className="text-[#F9F6F0] text-right">{product.details.origin}</span></li>
                <li className="flex justify-between border-b border-gray-800 pb-2"><span>Roast</span> <span className="text-[#F9F6F0] text-right">{product.details.roast}</span></li>
                <li className="flex justify-between border-b border-gray-800 pb-2"><span>Weight</span> <span className="text-[#F9F6F0] text-right">{product.details.weight}</span></li>
                <li className="pt-2">
                  <span className="block mb-1">Ingredients</span>
                  <span className="text-[#F9F6F0] leading-snug">{product.details.ingredients}</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => addToCart(product)}
              className="w-full bg-[#D4AF37] text-[#0B0C0C] py-4 font-sans font-bold tracking-widest uppercase hover:bg-[#b5952f] transition-all transform hover:scale-[1.01]"
            >
              Add to Cart — ${product.price.toFixed(2)}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">Free shipping on orders over $50</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navigation = ({ currentView, cartCount, setView, toggleCart }) => {
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
    window.scrollTo(0, 0);
  };

  const isTransparent = currentView === 'home' && !isScrolled;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent py-6' : 'bg-[#0B0C0C] shadow-lg py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <button className="md:hidden text-[#F9F6F0]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="h-10 md:h-12 w-auto cursor-pointer" onClick={() => handleNav('home')}>
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
        </div>

        <div className="hidden md:flex space-x-8 text-sm font-sans tracking-widest text-[#F9F6F0] opacity-80">
          <button onClick={() => handleNav('shop_all')} className="hover:text-[#D4AF37] transition-colors uppercase">Shop</button>
          <button onClick={() => handleNav('about')} className="hover:text-[#D4AF37] transition-colors uppercase">Our Story</button>
          <button onClick={() => handleNav('subscription')} className="hover:text-[#D4AF37] transition-colors uppercase">Subscription</button>
        </div>

        <div className="relative cursor-pointer text-[#F9F6F0] hover:text-[#D4AF37] transition-colors" onClick={toggleCart}>
          <ShoppingBag size={24} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-[#0B0C0C] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#0B0C0C] border-t border-gray-800 p-6 md:hidden flex flex-col space-y-4 shadow-2xl z-50">
           <button onClick={() => handleNav('shop_all')} className="text-[#F9F6F0] text-left font-sans tracking-widest">SHOP</button>
           <button onClick={() => handleNav('about')} className="text-[#F9F6F0] text-left font-sans tracking-widest">OUR STORY</button>
           <button onClick={() => handleNav('subscription')} className="text-[#F9F6F0] text-left font-sans tracking-widest">SUBSCRIPTION</button>
           <button onClick={() => handleNav('contact')} className="text-[#F9F6F0] text-left font-sans tracking-widest">CONTACT</button>
        </div>
      )}
    </nav>
  );
};

const CartDrawer = ({ isOpen, closeCart, cart, removeFromCart }) => {
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    // Construct PayPal Buy Now Link with specific total
    // Using _xclick command for simple payment of a specific amount
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&currency_code=USD&amount=${total.toFixed(2)}&item_name=Velure%20Order`;
    window.open(paypalUrl, '_blank');
  };

  return (
    <div className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={closeCart}></div>
      <div className={`relative w-full max-w-md bg-[#F9F6F0] h-full shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-6 bg-[#0B0C0C] text-[#F9F6F0] flex justify-between items-center">
          <h2 className="font-serif text-xl tracking-widest">YOUR RITUAL</h2>
          <button onClick={closeCart}><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 font-sans mt-10">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-4 border-b border-gray-200 pb-4">
                  <div className="w-20 h-20 bg-gray-200 overflow-hidden">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-[#0B0C0C] font-bold">{item.name}</h3>
                      <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
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
          <div className="flex justify-between items-center mb-4">
            <span className="font-sans text-gray-600">Subtotal</span>
            <span className="font-serif text-xl font-bold text-[#0B0C0C]">${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full bg-[#0B0C0C] text-[#D4AF37] py-4 font-sans font-bold tracking-widest transition-colors ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#222]'}`}
          >
            CHECKOUT — ${total.toFixed(2)}
          </button>
          <p className="text-xs text-center text-gray-400 mt-3">Processed securely by PayPal.</p>
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

const ContactView = () => (
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
      <form className="bg-white p-8 shadow-lg">
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Name</label>
          <input type="text" className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Email</label>
          <input type="email" className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]" />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Message</label>
          <textarea rows="4" className="w-full border border-gray-300 p-3 bg-gray-50 outline-none focus:border-[#D4AF37]"></textarea>
        </div>
        <button className="w-full bg-[#0B0C0C] text-[#D4AF37] py-4 font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">Send Message</button>
      </form>
    </div>
  </div>
);

const SubscriptionView = () => (
  <div className="pt-32 pb-24 bg-[#0B0C0C] min-h-screen text-[#F9F6F0]">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h1 className="text-5xl font-serif text-[#F9F6F0] mb-6">Never Run Out of <br /><span className="text-[#D4AF37] italic">The Ritual</span></h1>
      <p className="text-gray-400 text-lg mb-12">Join the Velure Club. Save 15% on every order and get exclusive access to small-batch roasts.</p>
      
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
            <button className="w-full bg-[#F9F6F0] text-[#0B0C0C] py-3 font-bold uppercase tracking-wider hover:bg-[#D4AF37]">Subscribe</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Footer = ({ setView }) => (
  <footer className="bg-[#050505] text-[#F9F6F0] pt-20 pb-10 border-t border-gray-900">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
      <div>
        <h2 className="font-serif text-2xl font-bold mb-6">VELURE</h2>
        <p className="text-gray-500 text-sm leading-relaxed">Small batch, artisan coffee sourced with intention and roasted for the discerning palate.</p>
      </div>
      <div>
        <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Shop</h3>
        <ul className="space-y-4 text-sm text-gray-400">
          <li><button onClick={() => setView('shop_all')} className="hover:text-[#F9F6F0]">All Coffee</button></li>
          <li><button onClick={() => setView('shop_functional')} className="hover:text-[#F9F6F0]">Functional Blends</button></li>
          <li><button onClick={() => setView('shop_single_origin')} className="hover:text-[#F9F6F0]">Single Origin</button></li>
          <li><button onClick={() => setView('subscription')} className="hover:text-[#F9F6F0]">Subscriptions</button></li>
        </ul>
      </div>
      <div>
        <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Company</h3>
        <ul className="space-y-4 text-sm text-gray-400">
          <li><button onClick={() => setView('about')} className="hover:text-[#F9F6F0]">Our Story</button></li>
          <li><button onClick={() => setView('sourcing')} className="hover:text-[#F9F6F0]">Sourcing</button></li>
          <li><button onClick={() => setView('wholesale')} className="hover:text-[#F9F6F0]">Wholesale</button></li>
          <li><button onClick={() => setView('contact')} className="hover:text-[#F9F6F0]">Contact</button></li>
        </ul>
      </div>
      <div>
        <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6">Newsletter</h3>
        <div className="flex border-b border-gray-700 pb-2">
          <input type="email" placeholder="Your email address" className="bg-transparent border-none outline-none text-[#F9F6F0] flex-grow placeholder-gray-600 text-sm" />
          <button className="text-[#D4AF37] font-bold text-sm uppercase">Join</button>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-900 flex justify-between items-center text-xs text-gray-600">
      <p>&copy; 2025 Velure Coffee Co.</p>
      <div className="flex space-x-6">
        <button onClick={() => setView('privacy')}>Privacy Policy</button>
        <button onClick={() => setView('terms')}>Terms of Service</button>
      </div>
    </div>
  </footer>
);

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

// --- MAIN APP COMPONENT ---

const App = () => {
  const [currentView, setView] = useState('home'); 
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Persistent Cart Logic
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('velure_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to load cart", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('velure_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setView('product_detail');
    window.scrollTo(0,0);
  };

  // --- CONTENT MAPPING ---
  
  const renderView = () => {
    if (currentView === 'product_detail' && selectedProduct) {
      return (
        <ProductDetailView 
          product={selectedProduct} 
          addToCart={addToCart} 
          onBack={() => setView('shop_all')} 
        />
      );
    }

    switch (currentView) {
      case 'home': return <HomeView openProductDetail={openProductDetail} setView={setView} />;
      case 'shop_all': return <ShopView category="all" openProductDetail={openProductDetail} />;
      case 'shop_functional': return <ShopView category="functional" openProductDetail={openProductDetail} />;
      case 'shop_single_origin': return <ShopView category="single_origin" openProductDetail={openProductDetail} />;
      case 'contact': return <ContactView />;
      case 'subscription': return <SubscriptionView />;
      
      case 'about': return (
        <TextView title="Our Story" content={`In a world that rushes, Velure exists to make you pause. We believe that your morning cup is more than a caffeine delivery system—it is the foundational ritual of your day.\n\nFrom the altitude of the Brazilian highlands to the precise extraction science of our functional mushroom blends, every decision we make is governed by one rule: Uncompromising Quality.\n\n"Velure is my invitation to you: Slow down, taste the difference, and start your day with excellence." — Joe, Founder`} />
      );

      case 'sourcing': return (
        <TextView title="Sourcing & Sustainability" content={`We partner directly with small-lot farmers who prioritize soil health and biodiversity. \n\nOur beans are shade-grown at high altitudes, ensuring a denser bean and a more complex flavor profile. We pay 20% above Fair Trade prices to ensure our partners can thrive.`} />
      );

      case 'wholesale': return (
        <TextView title="Wholesale Partners" content={`Interested in serving Velure at your cafe, hotel, or office? \n\nWe provide equipment sourcing, barista training, and custom blend development for our wholesale partners. Please contact us at wholesale@velureritual.com to apply.`} />
      );

      case 'privacy': return (
        <TextView title="Privacy Policy" content={`Last Updated: Dec 2025\n\n1. Information We Collect: We collect information you provide directly to us when you make a purchase.\n2. How We Use Information: To process transactions and send you related information.\n3. Sharing: We do not sell your data.`} />
      );

      case 'terms': return (
        <TextView title="Terms of Service" content={`1. Acceptance: By accessing this site, you agree to these terms.\n2. Returns: We accept returns on unopened bags within 30 days.\n3. Shipping: We ship globally.`} />
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

      <Navigation currentView={currentView} cartCount={cart.length} setView={setView} toggleCart={() => setIsCartOpen(true)} />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        closeCart={() => setIsCartOpen(false)} 
        cart={cart} 
        removeFromCart={removeFromCart} 
      />

      {renderView()}

      <Footer setView={setView} />
    </div>
  );
};

export default App;