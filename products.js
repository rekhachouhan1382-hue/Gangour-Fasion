/* ===================== DATA ===================== */

const categoryNames = {
  rakhi: 'Rakhi Collection',
  bangles: 'Bangles',
  jewellery: 'Jewellery',
  rings: 'Rings & Bracelets',
  bracelets: 'Rings & Bracelets',
  cosmetics: 'Cosmetics',
};

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/category/rakhi', label: 'Rakhi' },
  { path: '/category/bangles', label: 'Bangles' },
  { path: '/category/jewellery', label: 'Jewellery' },
  { path: '/category/rings-bracelets', label: 'Rings & Bracelets' },
  { path: '/category/cosmetics', label: 'Cosmetics' },
  { path: '/new-arrivals', label: 'New Arrivals' },
  { path: '/offers', label: 'Offers' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

function img(seed, n) {
  return `./images/${seed}${n}.jpg`;
}

const products = [
  // ---- RAKHI ----
  { id: 'rk1', name: 'Designer Kundan Rakhi with Chocolate Combo', type: 'Designer Rakhi', category: 'rakhi',
    price: 249, oldPrice: 349, images: [img('rakhi',1), img('rakhi',2)], rating: 4.6, reviews: 128,
    isNew: true, isFeatured: true, stock: 42,
    description: 'A beautifully handcrafted Kundan rakhi paired with premium chocolates — the perfect gift for your brother this Raksha Bandhan.',
    details: ['Handcrafted Kundan work', 'Includes roli-chawal & 2 chocolates', 'Adjustable thread', 'Suitable for all ages'] },
  { id: 'rk2', name: 'Traditional Silk Thread Rakhi Set of 3', type: 'Traditional Rakhi', category: 'rakhi',
    price: 179, images: [img('rakhi',3), img('rakhi',4)], rating: 4.4, reviews: 96, isBestSeller: true, stock: 60,
    description: 'A set of three traditional silk thread rakhis in vibrant colours, perfect for a large family celebration.',
    details: ['Set of 3 rakhis', 'Pure silk thread', 'Traditional motifs', 'Includes tilak pack'] },
  { id: 'rk3', name: 'Kids Cartoon Rakhi with Toy', type: 'Kids Rakhi', category: 'rakhi',
    price: 149, oldPrice: 199, images: [img('rakhi',5)], rating: 4.7, reviews: 74, isFeatured: true, stock: 35,
    description: 'A fun cartoon-themed rakhi bundled with a small toy — sure to bring a smile to your little brother\'s face.',
    details: ['Comes with mini toy', 'Skin-friendly thread', 'Bright cartoon design', 'Age 3+'] },
  { id: 'rk4', name: 'Premium Rakhi Gift Combo Hamper', type: 'Gift Combo', category: 'rakhi',
    price: 599, oldPrice: 799, images: [img('rakhi',6), img('rakhi',7)], rating: 4.8, reviews: 51, isNew: true, stock: 20,
    description: 'An elegant gift hamper featuring a designer rakhi, dry fruits, and a greeting card — a complete Raksha Bandhan package.',
    details: ['Designer rakhi + dry fruits', 'Premium gift box packaging', 'Includes greeting card', 'Ready to gift'] },

  // ---- BANGLES ----
  { id: 'bg1', name: 'Gold Plated Kada Bangle Set of 2', type: 'Kada', category: 'bangles',
    price: 449, oldPrice: 599, images: [img('bangle1',1), img('bangle1',2)], rating: 4.5, reviews: 87, isFeatured: true, stock: 25,
    description: 'A striking pair of gold-plated kada bangles with intricate engraving, perfect for festive wear.',
    details: ['Gold plated brass', 'Set of 2', 'Tarnish resistant coating', 'Available sizes 2.4"-2.8"'] },
  { id: 'bg2', name: 'Meenakari Glass Bangles Set of 12', type: 'Glass Bangles', category: 'bangles',
    price: 229, images: [img('bangle1',3)], rating: 4.3, reviews: 63, isBestSeller: true, stock: 80,
    description: 'Colourful meenakari-work glass bangles, a must-have for every festive and wedding occasion.',
    details: ['Set of 12 bangles', 'Handpainted meenakari work', 'Multiple colour options', 'Lightweight glass'] },
  { id: 'bg3', name: 'Oxidised Silver Cuff Bangle', type: 'Oxidised Bangle', category: 'bangles',
    price: 349, images: [img('bangle1',4), img('bangle1',4)], rating: 4.6, reviews: 45, isNew: true, stock: 30,
    description: 'A bold oxidised silver cuff bangle featuring traditional temple-style carving.',
    details: ['Oxidised silver finish', 'Adjustable open cuff', 'Temple-style carving', 'Unisex design'] },
  { id: 'bg4', name: 'Pearl & Kundan Bridal Bangle Set', type: 'Bridal Bangles', category: 'bangles',
    price: 899, oldPrice: 1199, images: [img('bangle1',5)], rating: 4.9, reviews: 38, isFeatured: true, stock: 12,
    description: 'An opulent bridal bangle set adorned with faux pearls and Kundan stones for your special day.',
    details: ['Set of 6 bangles', 'Faux pearl & Kundan work', 'Bridal collection', 'Comes in gift box'] },

  // ---- JEWELLERY ----
  { id: 'jw1', name: 'Antique Temple Necklace Set', type: 'Necklace Set', category: 'jewellery',
    price: 1299, oldPrice: 1799, images: [img('jewel',1), img('jewel',2)], rating: 4.7, reviews: 102, isBestSeller: true, isFeatured: true, stock: 15,
    description: 'A statement antique-finish temple necklace set with matching earrings, perfect for weddings and festive events.',
    details: ['Necklace + earrings set', 'Antique gold finish', 'Temple-style motifs', 'Comes with velvet box'] },
  { id: 'jw2', name: 'Kundan Choker Necklace with Earrings', type: 'Choker Set', category: 'jewellery',
    price: 999, images: [img('jewel',3)], rating: 4.5, reviews: 58, isNew: true, stock: 22,
    description: 'A regal Kundan choker paired with matching jhumka earrings for a royal festive look.',
    details: ['Choker + jhumka earrings', 'Kundan & pearl detailing', 'Adjustable dori closure', 'Lightweight alloy base'] },
  { id: 'jw3', name: 'Long Rani Haar Necklace', type: 'Long Necklace', category: 'jewellery',
    price: 1599, oldPrice: 1999, images: [img('jewel',4), img('jewel',4)], rating: 4.8, reviews: 41, isFeatured: true, stock: 10,
    description: 'A graceful long Rani Haar necklace, an elegant statement piece for weddings and grand celebrations.',
    details: ['Multi-layer design', 'Gold polish finish', 'Studded with stones', 'Comes with matching earrings'] },
  { id: 'jw4', name: 'Simple Gold Polish Mangalsutra', type: 'Mangalsutra', category: 'jewellery',
    price: 549, images: [img('jewel',5)], rating: 4.6, reviews: 77, isBestSeller: true, stock: 33,
    description: 'A minimal, everyday-wear mangalsutra with a delicate gold-polish pendant on a black bead chain.',
    details: ['Gold polish pendant', 'Black bead chain', 'Everyday wear', '18" chain length'] },

  // ---- RINGS ----
  { id: 'rg1', name: 'Adjustable Kundan Statement Ring', type: 'Statement Ring', category: 'rings',
    price: 199, oldPrice: 299, images: [img('ring1',1)], rating: 4.4, reviews: 66, isNew: true, stock: 50,
    description: 'A bold adjustable Kundan statement ring that pairs beautifully with both ethnic and western outfits.',
    details: ['Free size / adjustable', 'Kundan stone work', 'Gold-tone alloy', 'Perfect for gifting'] },
  { id: 'rg2', name: 'Minimalist Stackable Ring Set of 4', type: 'Stackable Rings', category: 'rings',
    price: 249, images: [img('ring2',1), img('ring2',1)], rating: 4.5, reviews: 39, isFeatured: true, stock: 40,
    description: 'A set of four dainty stackable rings for a modern, everyday minimalist look.',
    details: ['Set of 4 rings', 'Mixed sizes included', 'Tarnish resistant', 'Everyday wear'] },
  { id: 'rg3', name: 'Oxidised Boho Ring Set of 6', type: 'Boho Rings', category: 'rings',
    price: 279, oldPrice: 349, images: [img('ring3',1)], rating: 4.3, reviews: 28, stock: 45,
    description: 'A bohemian-inspired set of six oxidised rings featuring floral and geometric motifs.',
    details: ['Set of 6 rings', 'Oxidised silver finish', 'Boho floral design', 'Adjustable sizing'] },

  // ---- BRACELETS ----
  { id: 'br1', name: 'Beaded Charm Bracelet Set of 3', type: 'Charm Bracelet', category: 'bracelets',
    price: 229, images: [img('brace',1), img('brace',2)], rating: 4.5, reviews: 54, isNew: true, stock: 38,
    description: 'A trio of beaded charm bracelets that can be worn stacked or individually for a boho-chic vibe.',
    details: ['Set of 3 bracelets', 'Natural bead accents', 'Elastic stretch fit', 'Unisex design'] },
  { id: 'br2', name: 'Gold Plated Chain Link Bracelet', type: 'Chain Bracelet', category: 'bracelets',
    price: 349, oldPrice: 449, images: [img('brace',1)], rating: 4.6, reviews: 47, isBestSeller: true, stock: 27,
    description: 'A sleek gold-plated chain link bracelet that adds a subtle sparkle to any outfit.',
    details: ['Gold plated brass', 'Lobster clasp closure', '7.5" length + extender', 'Everyday wear'] },
  { id: 'br3', name: 'Rakhi Bracelet Combo for Sister', type: 'Rakhi Bracelet', category: 'bracelets',
    price: 199, images: [img('brace',1)], rating: 4.7, reviews: 33, isFeatured: true, stock: 30,
    description: 'A thoughtful bracelet-cum-rakhi gift, designed to be worn well beyond the festival.',
    details: ['Doubles as everyday bracelet', 'Adjustable cord closure', 'Comes gift-wrapped', 'Includes greeting tag'] },

  // ---- COSMETICS ----
  { id: 'cs1', name: 'Matte Liquid Lipstick Set of 3', type: 'Lipstick', category: 'cosmetics',
    price: 399, oldPrice: 549, images: [img('cosmetic',1), img('cosmetic',2)], rating: 4.5, reviews: 143, isBestSeller: true, isFeatured: true, stock: 70,
    description: 'A trio of long-lasting matte liquid lipsticks in versatile everyday-to-festive shades.',
    details: ['Set of 3 shades', 'Transfer-proof matte finish', 'Lightweight, non-drying formula', 'Cruelty-free'] },
  { id: 'cs2', name: 'Festive Eyeshadow Palette 12 Shades', type: 'Eyeshadow', category: 'cosmetics',
    price: 449, images: [img('cosmetic',2)], rating: 4.6, reviews: 98, isNew: true, stock: 55,
    description: 'A versatile 12-shade eyeshadow palette with matte and shimmer finishes for every festive look.',
    details: ['12 pigmented shades', 'Matte & shimmer finishes', 'Blendable formula', 'Includes mirror & applicator'] },
  { id: 'cs3', name: 'Kajal & Kohl Duo Pack', type: 'Kajal', category: 'cosmetics',
    price: 149, oldPrice: 199, images: [img('cosmetic',3)], rating: 4.4, reviews: 112, isBestSeller: true, stock: 90,
    description: 'A smudge-proof kajal duo that stays put all day, perfect for both traditional and everyday looks.',
    details: ['Pack of 2 kajal sticks', 'Smudge & waterproof', '12-hour wear formula', 'Deep black pigment'] },
  { id: 'cs4', name: 'Herbal Face Glow Kit', type: 'Skincare Kit', category: 'cosmetics',
    price: 599, oldPrice: 799, images: [img('cosmetic',4), img('cosmetic',4)], rating: 4.7, reviews: 64, isNew: true, stock: 24,
    description: 'A herbal face-glow kit with cleanser, scrub, and pack for radiant festive-ready skin.',
    details: ['Cleanser + scrub + face pack', 'Herbal, chemical-free formula', 'Suitable for all skin types', 'Ideal before festive occasions'] },
  { id: 'cs5', name: 'Bridal Makeup Combo Kit', type: 'Makeup Kit', category: 'cosmetics',
    price: 1299, oldPrice: 1699, images: [img('cosmetic',5)], rating: 5, reviews: 29, isFeatured: true, stock: 10,
    description: 'A complete bridal makeup combo covering base, eyes, lips and highlight for the big day.',
    details: ['Foundation, blush, highlighter', 'Eyeshadow palette + liner', '2 lipstick shades', 'Gift-ready packaging'] },
];

const reviews = [
  { name: 'xyz', location: 'Delhi', rating: 5, text: 'The Rakhi combo I ordered was even more beautiful than the photos! My brother loved it. Will definitely order again.' },
  { name: 'xyz', location: 'Mumbai', rating: 5, text: 'Absolutely gorgeous jewellery set for the price. Got so many compliments at the wedding I wore it to.' },
  { name: 'xyz', location: 'Jaipur', rating: 4, text: 'Good quality bangles and quick delivery. The colours were exactly as shown on the website.' },
  { name: 'xyz', location: 'Bengaluru', rating: 5, text: 'The lipstick set is amazing, the shades are so pigmented and long-lasting. My new favourite shop!' },
];
