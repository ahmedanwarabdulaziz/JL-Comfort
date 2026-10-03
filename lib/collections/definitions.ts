// SEO collection pages: /fabrics/<slug>. Each is a real, indexable page with its own heading, copy
// and product grid, built from how the catalog is tagged (Charlotte Fabrics' own material, pattern and
// colour taxonomy, plus the spec-sheet properties and markets). Slugs are letters and hyphens only,
// so they can never clash with a fabric's own slug (those always contain its pattern number).
//
// Copy is written for shoppers first: what the fabric is, where it works, how to choose. Keep each
// page's wording unique -- near-duplicate pages rank poorly.

export type CollectionGroup = 'type' | 'use' | 'pattern' | 'colour';

export const COLLECTION_GROUP_LABELS: Record<CollectionGroup, string> = {
  type: 'Shop by fabric type',
  use: 'Shop by use & performance',
  pattern: 'Shop by pattern',
  colour: 'Shop by colour',
};

// Which fabrics belong. Array rules match if the fabric has any of the listed values.
export interface CollectionRule {
  material?: string[];
  pattern?: string[];
  color?: string[];
  properties?: string[];
  markets?: string[];
  applications?: string[];
  cleanabilityContains?: string; // case-insensitive substring of the cleaning code
  minDoubleRubs?: number; // Wyzenbeek double rubs, parsed from the durability spec
}

export interface FabricCollection {
  slug: string;
  group: CollectionGroup;
  label: string; // short name for menus and links
  title: string; // the page's H1
  metaTitle: string; // <title>, before " | JL Comfort"
  description: string; // meta description, ~150 characters
  intro: string;
  sections: { heading: string; body: string }[];
  faqs?: { q: string; a: string }[];
  rule: CollectionRule;
  shopQuery?: string; // the same selection in the filterable shop, e.g. "material=velvet"
  related?: string[];
}

const typeCollection = (c: Omit<FabricCollection, 'group'>): FabricCollection => ({ ...c, group: 'type' });
const usageCollection = (c: Omit<FabricCollection, 'group'>): FabricCollection => ({ ...c, group: 'use' });

export const COLLECTIONS: FabricCollection[] = [
  // ───────────────────────────── Fabric types ─────────────────────────────
  typeCollection({
    slug: 'velvet',
    label: 'Velvet',
    title: 'Velvet Upholstery Fabric',
    metaTitle: 'Velvet Upholstery Fabric by the Yard',
    description: 'Shop velvet upholstery fabric by the yard in Canada. Plush, durable velvets for sofas, chairs and headboards, with free samples and prices in CAD.',
    intro: 'Rich colour, soft hand and a subtle sheen: velvet turns a sofa, accent chair or headboard into the centrepiece of a room. Our velvets are made for upholstery, so they wear as well as they look.',
    sections: [
      {
        heading: 'Why choose velvet for upholstery',
        body: 'Velvet has a short, dense pile that catches the light and deepens colour, which is why it reads as luxurious in any style, from traditional to modern. Today’s upholstery velvets are usually polyester or poly blends, making them far tougher and easier to care for than the silk velvets of the past. Many in this collection exceed 100,000 double rubs and carry stain- and fade-resistant finishes.',
      },
      {
        heading: 'Tips for choosing a velvet',
        body: 'Pile direction changes how the colour looks, so keep the nap running the same way on every cushion. Crushed and textured velvets hide wear and pet hair better than smooth, solid velvets. If the piece will sit in a sunny room, look for “fade resistant” in the specifications, and order a free sample to see the colour in your own light before you buy.',
      },
    ],
    faqs: [
      { q: 'Is velvet good for a sofa that gets daily use?', a: 'Yes. Performance polyester velvets are among the most durable upholstery fabrics available. Check each fabric’s double-rub rating: 30,000 or more is suitable for heavy residential use.' },
      { q: 'How do I clean velvet upholstery?', a: 'Vacuum regularly with a soft brush and blot spills straight away. Follow the cleaning code on the fabric page: W means water-based cleaners, S means solvent-based, and W/S allows either.' },
    ],
    rule: { material: ['velvet'] },
    shopQuery: 'material=velvet',
    related: ['chenille', 'performance', 'pet-friendly', 'solid'],
  }),
  typeCollection({
    slug: 'chenille',
    label: 'Chenille',
    title: 'Chenille Upholstery Fabric',
    metaTitle: 'Chenille Upholstery Fabric by the Yard',
    description: 'Soft, textured chenille upholstery fabric by the yard. Cozy, hard-wearing chenilles for sofas and family rooms. Free samples, shipped across Canada.',
    intro: 'Chenille is the fabric you want to sink into: a soft, velvety yarn woven into a textured cloth that feels warm and relaxed while standing up to everyday life.',
    sections: [
      {
        heading: 'What makes chenille special',
        body: 'Chenille yarn has short fibres wrapped around a core, giving it a tufted, caterpillar-like texture (the word is French for caterpillar). Woven into upholstery, it creates depth and softness without the formality of velvet. It’s a favourite for family-room sofas, sectionals and reading chairs.',
      },
      {
        heading: 'Choosing a durable chenille',
        body: 'Tighter weaves with a higher double-rub count resist snagging and pilling best. Solid and tone-on-tone chenilles are the most versatile, while chenille jacquards add pattern with the same soft hand. If you have cats, choose a low-loop chenille and order a sample to test it.',
      },
    ],
    rule: { material: ['chenille'] },
    shopQuery: 'material=chenille',
    related: ['velvet', 'boucle', 'tweed', 'pet-friendly'],
  }),
  typeCollection({
    slug: 'boucle',
    label: 'Bouclé',
    title: 'Bouclé Upholstery Fabric',
    metaTitle: 'Bouclé Fabric by the Yard',
    description: 'Shop bouclé upholstery fabric by the yard: the looped, textured fabric behind today’s modern chairs and sofas. Free samples, prices in CAD.',
    intro: 'Bouclé’s looped yarns give it a soft, nubby, cloud-like texture that has become the signature of modern and mid-century furniture.',
    sections: [
      {
        heading: 'Where bouclé works best',
        body: 'Bouclé shines on sculptural pieces such as curved sofas, barrel chairs, ottomans and headboards, where its texture catches light and shadow. Creamy whites and oatmeal tones are the classic look, but coloured bouclés make a bold statement on a single accent chair.',
      },
      {
        heading: 'Living with bouclé',
        body: 'Because the loops are raised, pet claws can catch them, so bouclé is best for adult spaces or low-traffic pieces. Performance bouclés with stain-resistant finishes are easier to keep looking fresh. Always order a sample: bouclé loops vary a lot in size and softness.',
      },
    ],
    rule: { material: ['boucle'] },
    shopQuery: 'material=boucle',
    related: ['shearling', 'chenille', 'tweed', 'white'],
  }),
  typeCollection({
    slug: 'linen',
    label: 'Linen',
    title: 'Linen & Linen-Look Upholstery Fabric',
    metaTitle: 'Linen Upholstery Fabric by the Yard',
    description: 'Linen and linen-look upholstery fabric by the yard, from natural linen blends to durable performance linens. Free samples, shipped across Canada.',
    intro: 'Relaxed, natural and timeless, linen and linen-look fabrics bring an effortless texture to slipcovers, dining chairs, headboards and drapery.',
    sections: [
      {
        heading: 'Natural linen or linen-look?',
        body: 'Natural linen and linen blends have a beautiful, slightly irregular slub and breathe well, but they wrinkle and can be less forgiving with spills. Linen-look polyesters and performance linens copy that texture while adding stain resistance and durability, which makes them the practical choice for sofas and family spaces.',
      },
      {
        heading: 'Styling linen',
        body: 'Linen suits coastal, farmhouse, Scandinavian and modern-organic rooms. Pair a solid linen sofa with patterned pillows, or use the same linen for upholstery and drapery for a calm, cohesive room.',
      },
    ],
    rule: { material: ['linen'] },
    shopQuery: 'material=linen',
    related: ['performance', 'drapery', 'solid', 'beige'],
  }),
  typeCollection({
    slug: 'tweed',
    label: 'Tweed & Textures',
    title: 'Tweed & Textured Upholstery Fabric',
    metaTitle: 'Tweed & Textured Upholstery Fabric',
    description: 'Tweed and textured upholstery fabric by the yard: tactile weaves that hide wear and add depth. Hundreds of colours, free samples, prices in CAD.',
    intro: 'Tweeds and textured weaves add depth and character while quietly hiding everyday wear, which makes them one of the smartest choices for well-used furniture.',
    sections: [
      {
        heading: 'Why texture is practical',
        body: 'Multi-tonal yarns and visible weave structure disguise crumbs, pet hair and small marks far better than flat, solid fabrics. Many textured fabrics here are rated for heavy-duty use, so they’re a strong fit for sectionals, dining chairs and anything the kids climb on.',
      },
      {
        heading: 'Choosing a texture',
        body: 'Fine tweeds read almost solid from across the room; heavier slubs and basketweaves are more casual. Look at the fabric close up and at a distance, which a free sample lets you do in your own space.',
      },
    ],
    rule: { material: ['tweed-textures'] },
    shopQuery: 'material=tweed-textures',
    related: ['chenille', 'heavy-duty', 'pet-friendly', 'herringbone'],
  }),
  typeCollection({
    slug: 'crypton',
    label: 'Crypton',
    title: 'Crypton Performance Fabric',
    metaTitle: 'Crypton Fabric by the Yard in Canada',
    description: 'Buy Crypton performance fabric by the yard in Canada. Stain, moisture and odour resistant fabric for homes with kids and pets. Free samples.',
    intro: 'Crypton fabrics are engineered for real life: a built-in barrier keeps spills on the surface, and stain and odour resistance is part of the fibre, not a spray that wears off.',
    sections: [
      {
        heading: 'How Crypton works',
        body: 'Crypton’s technology is applied throughout the fabric, so liquids bead up and can be blotted away instead of soaking into the cushion. It also resists stains, odours and bacteria, and many Crypton fabrics can be cleaned with a diluted bleach solution, which makes them popular for family homes, dining chairs, restaurants and healthcare settings.',
      },
      {
        heading: 'Crypton without compromise',
        body: 'Crypton fabrics come in velvets, textures, linens and patterns that look and feel like ordinary upholstery. Check each fabric’s cleaning code and specifications for its exact care and durability rating.',
      },
    ],
    faqs: [
      { q: 'Is Crypton fabric waterproof?', a: 'Crypton is moisture-resistant: spills sit on the surface so you can wipe them up. It protects the cushion from most everyday spills, but it is not intended for outdoor furniture left in the rain.' },
      { q: 'Is Crypton good for dogs and cats?', a: 'Yes. Its stain, odour and moisture resistance make it one of the most pet-friendly upholstery options. Tightly woven Crypton fabrics also resist claw snags better than loose weaves.' },
    ],
    rule: { material: ['crypton'] },
    shopQuery: 'material=crypton',
    related: ['performance', 'pet-friendly', 'bleach-cleanable'],
  }),
  typeCollection({
    slug: 'microsuede',
    label: 'Microfiber & Microsuede',
    title: 'Microfiber & Microsuede Upholstery Fabric',
    metaTitle: 'Microsuede & Microfiber Upholstery Fabric',
    description: 'Microsuede and microfiber upholstery fabric by the yard: soft, suede-like and easy to clean. Great for pets and busy homes. Free samples.',
    intro: 'Soft as suede and far easier to live with, microfiber and microsuede fabrics are a go-to for recliners, sectionals, dining seats and homes with pets.',
    sections: [
      {
        heading: 'Why microsuede is so practical',
        body: 'Microfibers are extremely fine, tightly packed polyester fibres. The dense surface resists pilling, is hard for claws to catch, and releases pet hair easily. Most spills can be blotted before they soak in.',
      },
      {
        heading: 'Care tips',
        body: 'Brush lightly to lift the nap after cleaning. Many microsuedes use a solvent-based (S) cleaning code, so check the specifications before using water on a stain.',
      },
    ],
    rule: { material: ['microfiber-microsuede'] },
    shopQuery: 'material=microfiber-microsuede',
    related: ['pet-friendly', 'automotive', 'velvet', 'solid'],
  }),
  typeCollection({
    slug: 'canvas-denim',
    label: 'Canvas, Denim & Twill',
    title: 'Canvas, Denim & Twill Upholstery Fabric',
    metaTitle: 'Canvas, Denim & Twill Fabric by the Yard',
    description: 'Heavy-duty canvas, denim and twill fabric by the yard for slipcovers, cushions, benches and upholstery. Durable, casual and easy to sew. Free samples.',
    intro: 'Crisp, sturdy and casual, canvas, denim and twill are workhorse fabrics for slipcovers, bench cushions, outdoor-inspired rooms and anything that needs to be tough.',
    sections: [
      {
        heading: 'Where to use them',
        body: 'Their tight, flat weaves hold a clean tailored line, which makes them ideal for box cushions, slipcovered sofas, dining benches and headboards. Cotton canvases and twills soften beautifully with time; polyester and solution-dyed versions resist fading and staining.',
      },
    ],
    rule: { material: ['canvas-denim-twill'] },
    shopQuery: 'material=canvas-denim-twill',
    related: ['outdoor', 'heavy-duty', 'striped', 'solid'],
  }),
  typeCollection({
    slug: 'tapestry',
    label: 'Tapestry',
    title: 'Tapestry Upholstery Fabric',
    metaTitle: 'Tapestry Upholstery Fabric by the Yard',
    description: 'Woven tapestry upholstery fabric by the yard: rich, multi-colour designs for traditional chairs, ottomans and accent pieces. Free samples in Canada.',
    intro: 'Tapestry fabrics weave the pattern right into the cloth using many coloured yarns, giving traditional and eclectic furniture rich, heirloom character.',
    sections: [
      {
        heading: 'Using tapestry well',
        body: 'Tapestry is heavy and hard-wearing, suited to wingback chairs, dining seats, ottomans, headboards and bench cushions. Centre the main motif on seat and back cushions (the pattern repeat on each fabric page tells you how much extra yardage to allow for matching).',
      },
    ],
    rule: { material: ['tapestry'] },
    shopQuery: 'material=tapestry',
    related: ['damask', 'floral', 'matelasse', 'paisley'],
  }),
  typeCollection({
    slug: 'matelasse',
    label: 'Matelassé',
    title: 'Matelassé Fabric',
    metaTitle: 'Matelassé Fabric by the Yard',
    description: 'Matelassé fabric by the yard: a quilted-look woven fabric for bedding, headboards and upholstery. Elegant texture, free samples, prices in CAD.',
    intro: 'Matelassé is woven to look quilted: a raised, padded pattern gives bedding, headboards and upholstery a soft, elegant dimension.',
    sections: [
      {
        heading: 'Where matelassé works',
        body: 'Traditionally used for coverlets and pillow shams, matelassé is also beautiful on upholstered headboards, ottomans and dining chairs. Tone-on-tone designs keep the look calm and let the texture do the talking.',
      },
    ],
    rule: { material: ['matelasse'] },
    shopQuery: 'material=matelasse',
    related: ['tapestry', 'damask', 'white', 'embroidered'],
  }),
  typeCollection({
    slug: 'shearling',
    label: 'Shearling & Faux Fur',
    title: 'Faux Shearling Fabric',
    metaTitle: 'Faux Shearling Fabric by the Yard',
    description: 'Faux shearling fabric by the yard for cozy accent chairs, ottomans, pillows and throws. Soft, textured and on trend. Free samples, shipped in Canada.',
    intro: 'Plush and cozy, faux shearling brings a warm, touchable texture to accent chairs, ottomans, benches and pillows.',
    sections: [
      {
        heading: 'Styling shearling',
        body: 'Shearling works best as an accent: a single lounge chair, a bench at the foot of the bed or a set of cushions. It pairs naturally with wood, leather and linen for a warm, Scandinavian-inspired room.',
      },
    ],
    rule: { material: ['shearling', 'faux-wool'] },
    shopQuery: 'material=shearling',
    related: ['boucle', 'chenille', 'white', 'beige'],
  }),
  typeCollection({
    slug: 'metallic',
    label: 'Metallic',
    title: 'Metallic Upholstery Fabric',
    metaTitle: 'Metallic Upholstery Fabric by the Yard',
    description: 'Metallic upholstery fabric by the yard with gold, silver and lurex accents for glamorous chairs, headboards and pillows. Free samples in Canada.',
    intro: 'A touch of shimmer goes a long way: metallic fabrics weave in gold, silver or bronze threads for glamorous headboards, accent chairs and pillows.',
    sections: [
      {
        heading: 'Using metallic fabric',
        body: 'Metallic threads catch the light, so these fabrics look different by day and by lamplight. Use them where they’ll be admired rather than heavily used: headboards, accent chairs, pillows and drapery.',
      },
    ],
    rule: { material: ['metallic'] },
    shopQuery: 'material=metallic',
    related: ['velvet', 'damask', 'geometric', 'embroidered'],
  }),
  typeCollection({
    slug: 'embroidered',
    label: 'Embroidered',
    title: 'Embroidered Fabric',
    metaTitle: 'Embroidered Fabric by the Yard',
    description: 'Embroidered fabric by the yard for pillows, drapery, headboards and accent pieces. Detailed stitched designs, free samples, prices in CAD.',
    intro: 'Stitched designs raised above the base cloth give embroidered fabrics a crafted, luxurious detail that print can’t match.',
    sections: [
      {
        heading: 'Where embroidery shines',
        body: 'Embroidered fabrics are ideal for decorative pillows, drapery panels, headboards and accent chairs: pieces that are seen up close. For heavy-use seating, choose a design with a tight, low stitch.',
      },
    ],
    rule: { material: ['embroidery'] },
    shopQuery: 'material=embroidery',
    related: ['metallic', 'floral', 'matelasse', 'drapery'],
  }),
  typeCollection({
    slug: 'printed',
    label: 'Printed Fabric',
    title: 'Printed Upholstery & Decor Fabric',
    metaTitle: 'Printed Upholstery Fabric by the Yard',
    description: 'Printed upholstery and decor fabric by the yard: florals, botanicals, geometrics and more for chairs, pillows and drapery. Free samples in Canada.',
    intro: 'Printed fabrics offer the widest range of designs and colours, from painterly florals to crisp graphics, for upholstery, pillows, drapery and bedding.',
    sections: [
      {
        heading: 'Choosing a print',
        body: 'Large-scale prints make a statement on a headboard or accent chair; smaller prints are easier to use on sofas and dining chairs. Check the pattern repeat on each fabric page, since larger repeats need extra yardage to match across cushions.',
      },
    ],
    rule: { material: ['prints'] },
    shopQuery: 'material=prints',
    related: ['floral', 'botanical', 'geometric', 'drapery'],
  }),
  typeCollection({
    slug: 'woven',
    label: 'Woven Patterns',
    title: 'Woven Pattern Upholstery Fabric',
    metaTitle: 'Woven Pattern & Jacquard Upholstery Fabric',
    description: 'Woven pattern and jacquard upholstery fabric by the yard. Designs woven into the cloth for lasting durability. Thousands of styles, free samples.',
    intro: 'In a woven pattern the design is built from the yarns themselves rather than printed on top, so it won’t wear off, and it adds texture as well as colour.',
    sections: [
      {
        heading: 'Why woven patterns last',
        body: 'Jacquard and dobby looms weave coloured yarns into the design, which is why woven fabrics are the standard for durable upholstery. They range from subtle tone-on-tone textures to bold geometrics and traditional damasks.',
      },
    ],
    rule: { material: ['woven-patterns'] },
    shopQuery: 'material=woven-patterns',
    related: ['geometric', 'damask', 'heavy-duty', 'tweed'],
  }),

  // ───────────────────────────── Uses & performance ─────────────────────────────
  usageCollection({
    slug: 'performance',
    label: 'Performance & Stain-Resistant',
    title: 'Performance & Stain-Resistant Upholstery Fabric',
    metaTitle: 'Performance & Stain-Resistant Upholstery Fabric',
    description: 'Performance, stain-resistant upholstery fabric by the yard in Canada: durable and easy to clean for kids, pets and busy homes. Free samples, CAD pricing.',
    intro: 'Performance fabrics are made to handle spills, sunlight and daily wear without giving up on style, so the sofa you love stays looking new.',
    sections: [
      {
        heading: 'What makes a fabric “performance”',
        body: 'Performance fabrics combine durable fibres with protective technology: stain and liquid repellency, fade resistance, and often resistance to odour, mildew and bacteria. Many are also rated for heavy-duty use, exceeding 100,000 double rubs.',
      },
      {
        heading: 'How stain resistance works',
        body: 'Some fabrics have a finish that makes liquids bead on the surface; others use fibres that are naturally resistant, such as solution-dyed synthetics. Either way, blot spills quickly and follow the fabric’s cleaning code. Dining chairs, kitchen banquettes, family-room sofas and kids’ rooms benefit most.',
      },
      {
        heading: 'Who they’re for',
        body: 'If you have children or pets, eat on the sofa, host often, or have furniture in a sunny room, a performance fabric is worth it. They’re also the standard for restaurants, offices and hospitality spaces.',
      },
    ],
    faqs: [
      { q: 'What is the difference between performance fabric and Crypton?', a: 'Crypton is one brand of performance technology. “Performance fabric” is the wider category, which also includes solution-dyed fabrics and other stain-resistant finishes. All are designed to be easy to clean and long-lasting.' },
      { q: 'Are performance fabrics safe?', a: 'Many of our performance fabrics are PFAS-free and Greenguard Gold certified for low chemical emissions; look for those certifications in each fabric’s specifications.' },
    ],
    rule: { properties: ['Performance Grade'] },
    related: ['crypton', 'pet-friendly', 'bleach-cleanable', 'heavy-duty'],
  }),
  usageCollection({
    slug: 'pet-friendly',
    label: 'Pet-Friendly',
    title: 'Pet-Friendly Upholstery Fabric',
    metaTitle: 'Pet-Friendly Upholstery Fabric',
    description: 'Pet-friendly upholstery fabric by the yard: durable, stain-resistant fabrics that stand up to dogs and cats. Shipped across Canada with free samples.',
    intro: 'Dogs on the couch? Cats on the armchair? These fabrics are chosen to stand up to claws, fur and the occasional accident.',
    sections: [
      {
        heading: 'What to look for',
        body: 'Tight, flat weaves resist snagging better than loops or loose textures, so avoid bouclé and open weaves if your pets scratch. Stain- and odour-resistant finishes make clean-up simple, and mid-tone or multi-tonal colours hide fur better than very light or very dark solids.',
      },
      {
        heading: 'Best choices for pet owners',
        body: 'Microsuede, Crypton and tightly woven performance fabrics are the top picks. Match the colour to your pet’s coat if you can, and order a free sample to test how easily fur brushes off.',
      },
    ],
    faqs: [
      { q: 'What upholstery fabric is best for cats?', a: 'Tightly woven fabrics with a smooth surface, such as microsuede or performance velvet, give claws little to catch on. Avoid looped fabrics like bouclé and loose weaves like some linens.' },
    ],
    rule: { properties: ['Pet Friendly'] },
    related: ['performance', 'crypton', 'microsuede', 'bleach-cleanable'],
  }),
  usageCollection({
    slug: 'outdoor',
    label: 'Outdoor & Marine',
    title: 'Outdoor & Marine Upholstery Fabric',
    metaTitle: 'Outdoor & Marine Fabric by the Yard in Canada',
    description: 'Outdoor and marine fabric by the yard for patio cushions, boat seats and sunrooms. Weather, fade and mildew resistant. Shipped across Canada, free samples.',
    intro: 'Fabrics made for patios, decks, boats, cottages and sunrooms: they resist fading, moisture and mildew so your cushions last season after season.',
    sections: [
      {
        heading: 'Built for the Canadian outdoors',
        body: 'Outdoor fabrics are typically solution-dyed acrylic, olefin or polyester, with colour locked into the fibre so it resists UV fading. Mildew-resistant, quick-drying construction helps them handle rain, humidity and lake-side air.',
      },
      {
        heading: 'Marine-grade fabric for boats and docks',
        body: 'Marine fabrics combine UV-stable colour, water and mildew resistance, and high abrasion ratings to survive constant sun and moisture. Use them for boat seating, cabin cushions, dock furniture and anywhere near the water.',
      },
      {
        heading: 'Care and storage',
        body: 'Brush off dirt and rinse with mild soap and water; many outdoor fabrics can take a diluted bleach solution for mildew. Store cushions indoors or covered over winter to make them last much longer. Pair with outdoor-grade foam for cushions that drain and dry quickly.',
      },
    ],
    faqs: [
      { q: 'Can outdoor fabric be used indoors?', a: 'Absolutely. Outdoor fabrics are a great choice for sunrooms, kids’ rooms and dining chairs, where their fade and stain resistance pays off.' },
    ],
    rule: { markets: ['Outdoor', 'Outdoors', 'Marine'] },
    shopQuery: 'market=Outdoor',
    related: ['outdoor', 'canvas-denim', 'striped', 'bleach-cleanable'],
  }),
  usageCollection({
    slug: 'commercial',
    label: 'Commercial / Contract',
    title: 'Commercial Upholstery Fabric',
    metaTitle: 'Commercial & Contract Upholstery Fabric',
    description: 'Commercial and contract-grade upholstery fabric by the yard for restaurants, offices, hotels and clinics. Durable and cleanable, shipped across Canada.',
    intro: 'Contract-grade fabrics for restaurants, offices, hotels, clinics and other high-traffic spaces, rated for the durability and cleanability commercial seating needs.',
    sections: [
      {
        heading: 'Choosing fabric for commercial seating',
        body: 'For commercial use, look for at least 30,000 double rubs (heavy duty) and a cleaning code that suits your maintenance routine, such as bleach-cleanable for healthcare and food service. Check whether your project requires specific flammability standards, such as CAN/ULC-S109.',
      },
      {
        heading: 'Ordering for a project',
        body: 'Order free samples for approval before you commit to yardage. For larger or repeat orders, contact us and we’ll help with quantities and availability.',
      },
    ],
    rule: { markets: ['Contract'] },
    shopQuery: 'market=Contract',
    related: ['heavy-duty', 'bleach-cleanable', 'fire-rated', 'healthcare'],
  }),
  usageCollection({
    slug: 'healthcare',
    label: 'Healthcare',
    title: 'Healthcare Upholstery Fabric',
    metaTitle: 'Healthcare Upholstery Fabric',
    description: 'Healthcare-grade upholstery fabric by the yard for clinics, waiting rooms and senior living. Bleach-cleanable, antimicrobial options. Free samples.',
    intro: 'Fabrics for clinics, dental offices, waiting rooms and senior living, designed to be cleaned and disinfected often without losing their looks.',
    sections: [
      {
        heading: 'What healthcare spaces need',
        body: 'Look for bleach-cleanable fabrics with moisture barriers and resistance to bacteria and mildew, plus a high abrasion rating. Warm, residential-looking designs help waiting rooms and resident spaces feel welcoming.',
      },
    ],
    rule: { markets: ['Healthcare'] },
    shopQuery: 'market=Healthcare',
    related: ['bleach-cleanable', 'commercial', 'crypton', 'performance'],
  }),
  usageCollection({
    slug: 'automotive',
    label: 'Automotive',
    title: 'Automotive Upholstery Fabric',
    metaTitle: 'Automotive Upholstery Fabric by the Yard',
    description: 'Automotive upholstery fabric by the yard for car, truck and RV seats and interiors. Durable, fade-resistant fabrics shipped across Canada.',
    intro: 'Durable fabrics for car, truck, RV and camper interiors, made to handle sun through the windows and constant getting in and out.',
    sections: [
      {
        heading: 'Choosing automotive fabric',
        body: 'Vehicle seating needs high abrasion resistance and colour that won’t fade in the sun. Match the weight of the original fabric when restoring seats, and order a sample to check colour against your interior.',
      },
    ],
    rule: { markets: ['Auto'] },
    shopQuery: 'market=Auto',
    related: ['microsuede', 'heavy-duty', 'outdoor', 'performance'],
  }),
  usageCollection({
    slug: 'heavy-duty',
    label: 'Heavy-Duty',
    title: 'Heavy-Duty Upholstery Fabric',
    metaTitle: 'Heavy-Duty Upholstery Fabric (100,000+ Rubs)',
    description: 'Heavy-duty upholstery fabric rated 100,000+ double rubs, for sofas, sectionals, dining chairs and commercial seating. Free samples, prices in CAD.',
    intro: 'Every fabric here exceeds 100,000 Wyzenbeek double rubs, several times the rating needed for everyday home use, for furniture that works hard.',
    sections: [
      {
        heading: 'What double rubs mean',
        body: 'The Wyzenbeek test rubs a fabric back and forth until it shows wear. 15,000 double rubs is suitable for general home use; 30,000+ is considered heavy duty and commercial grade. Fabrics exceeding 100,000 double rubs are built for daily-use sofas, dining chairs, offices and hospitality.',
      },
    ],
    rule: { minDoubleRubs: 100_000 },
    related: ['performance', 'commercial', 'tweed', 'woven'],
  }),
  usageCollection({
    slug: 'bleach-cleanable',
    label: 'Bleach-Cleanable',
    title: 'Bleach-Cleanable Upholstery Fabric',
    metaTitle: 'Bleach-Cleanable Upholstery Fabric',
    description: 'Bleach-cleanable upholstery fabric by the yard: clean and disinfect with a diluted bleach solution. For kitchens, kids, healthcare and outdoors.',
    intro: 'When you need to truly disinfect, not just wipe down, bleach-cleanable fabrics can be cleaned with a diluted bleach solution without fading or damage.',
    sections: [
      {
        heading: 'Using bleach safely on fabric',
        body: 'Follow each fabric’s cleaning code for the recommended dilution, often 1 part bleach to 10 parts water. Test on a hidden area first, then rinse with clean water and let it air dry.',
      },
    ],
    rule: { cleanabilityContains: 'bleach' },
    related: ['healthcare', 'crypton', 'outdoor', 'bleach-cleanable'],
  }),
  usageCollection({
    slug: 'eco-friendly',
    label: 'Eco-Friendly',
    title: 'Eco-Friendly Upholstery Fabric',
    metaTitle: 'Eco-Friendly & PFAS-Free Upholstery Fabric',
    description: 'Eco-friendly upholstery fabric: PFAS-free, Greenguard Gold certified and recycled-fibre options by the yard. Free samples, shipped across Canada.',
    intro: 'Fabrics with a lighter footprint: many are PFAS-free, Greenguard Gold certified for low emissions, or made with recycled and renewable fibres.',
    sections: [
      {
        heading: 'Understanding the certifications',
        body: 'Greenguard Gold certification means a fabric meets strict limits on chemical emissions, which matters for bedrooms, nurseries and schools. PFAS-free fabrics achieve stain resistance without “forever chemicals”. Check each fabric’s specifications for its exact certifications.',
      },
    ],
    rule: { properties: ['Eco Friendly', 'Greenguard Gold'] },
    related: ['performance', 'linen', 'pet-friendly', 'bleach-cleanable'],
  }),
  usageCollection({
    slug: 'drapery',
    label: 'Drapery',
    title: 'Drapery & Curtain Fabric',
    metaTitle: 'Drapery & Curtain Fabric by the Yard',
    description: 'Drapery and curtain fabric by the yard for custom curtains, Roman shades and valances. Linens, prints, sheers and more. Free samples in Canada.',
    intro: 'Fabrics suited to curtains, Roman shades, valances and bed skirts, from airy linens and sheers to prints and textured weaves.',
    sections: [
      {
        heading: 'Choosing drapery fabric',
        body: 'Lighter fabrics drape softly and filter light; heavier fabrics hang in fuller folds and add insulation (line them for privacy and to protect against fading). Allow for the pattern repeat, and plan on 2 to 2.5 times the window width for fullness.',
      },
    ],
    rule: { applications: ['Drapery'] },
    shopQuery: 'application=Drapery',
    related: ['linen', 'printed', 'embroidered', 'fire-rated'],
  }),
  usageCollection({
    slug: 'fire-rated',
    label: 'Fire-Rated (CAN/ULC-S109)',
    title: 'Fire-Rated Fabric: CAN/ULC-S109 & NFPA 701',
    metaTitle: 'Fire-Rated Fabric: CAN/ULC-S109 & NFPA 701',
    description: 'Fabric that passes CAN/ULC-S109 and NFPA 701 flame tests, for commercial drapery and projects with fire-code requirements. Shipped across Canada.',
    intro: 'Fabrics tested to CAN/ULC-S109, the Canadian flame-resistance standard for textiles, and to NFPA 701, for commercial and public spaces with fire-code requirements.',
    sections: [
      {
        heading: 'About these standards',
        body: 'CAN/ULC-S109 is the Canadian standard flame test for textiles and films, often required for drapery in commercial, institutional and public buildings. NFPA 701 is the equivalent US standard. Always confirm the requirement for your specific project with your designer or fire authority.',
      },
    ],
    rule: { properties: ['Passes CAN/ULC-S109'] },
    related: ['drapery', 'commercial', 'healthcare', 'heavy-duty'],
  }),

  // ───────────────────────────── Patterns ─────────────────────────────
  ...([
    ['floral', 'Floral', ['floral'], 'Floral Upholstery Fabric', 'From romantic cabbage roses to modern, painterly blooms, floral fabrics bring life and colour to chairs, pillows, headboards and drapery.', 'Scale is everything: large florals suit a single accent chair or headboard, while small, ditsy florals work on dining chairs and cushions. Pull a solid colour from the print for the rest of the room.', ['botanical', 'printed', 'damask', 'pink']],
    ['striped', 'Stripes', ['stripe'], 'Striped Upholstery Fabric', 'Stripes are the most versatile pattern there is: classic ticking, bold cabana stripes, subtle pinstripes and more for upholstery, cushions and drapery.', 'Vertical stripes on a chair back add height; horizontal stripes widen. On cushions, decide the stripe direction before ordering, since it affects how much yardage you need.', ['plaid', 'outdoor', 'canvas-denim', 'blue']],
    ['plaid', 'Plaid & Tartan', ['plaid'], 'Plaid Upholstery Fabric', 'Plaid and tartan fabrics bring warmth and heritage to armchairs, benches, ottomans and cottage furniture.', 'Plaids need careful matching across cushions and seams, so allow extra yardage for the repeat. Smaller-scale plaids are easier to match and suit dining chairs and pillows.', ['houndstooth', 'striped', 'tweed', 'red']],
    ['geometric', 'Geometric', ['abstract-geometric'], 'Geometric Upholstery Fabric', 'Graphic, modern and endlessly varied, geometric and abstract fabrics add energy to contemporary sofas, chairs and cushions.', 'Small, tight geometrics read as texture from a distance and hide wear well. Bold, large-scale geometrics make the piece a focal point, so keep the surrounding fabrics calmer.', ['diamond', 'herringbone', 'woven', 'greek-key']],
    ['damask', 'Damask', ['damask'], 'Damask Upholstery Fabric', 'Elegant, symmetrical damask patterns have dressed fine furniture for centuries and still add polish to dining chairs, headboards and drapery.', 'Tone-on-tone damasks feel refined and modern; high-contrast damasks are more traditional and dramatic. Centre the medallion on each seat and back for a tailored finish.', ['tapestry', 'paisley', 'matelasse', 'floral']],
    ['paisley', 'Paisley', ['paisley'], 'Paisley Upholstery Fabric', 'Rich, swirling paisley designs bring a bohemian, well-travelled feel to armchairs, pillows and bedding.', 'Paisley pairs well with stripes and solids pulled from its palette. Use it on a statement chair or pillows to add pattern without overwhelming a room.', ['damask', 'global', 'floral', 'red']],
    ['animal-print', 'Animal Print', ['animal-print'], 'Animal Print Upholstery Fabric', 'Leopard, zebra, snakeskin and more: animal prints add instant personality to accent chairs, ottomans, benches and pillows.', 'Animal prints act almost like a neutral when used in small doses. A single ottoman or pair of pillows is often all a room needs.', ['velvet', 'geometric', 'brown', 'black']],
    ['herringbone', 'Herringbone & Chevron', ['herringbone-chevron'], 'Herringbone & Chevron Fabric', 'Classic tailoring for furniture: herringbone and chevron weaves add subtle movement and texture to sofas, chairs and benches.', 'Fine herringbones read as a textured solid and are very forgiving of everyday wear. Larger chevrons make a stronger graphic statement.', ['tweed', 'houndstooth', 'geometric', 'grey']],
    ['houndstooth', 'Check & Houndstooth', ['check-houndstooth'], 'Check & Houndstooth Fabric', 'Gingham, buffalo check and houndstooth: timeless checks for farmhouse, cottage and classic menswear-inspired rooms.', 'Checks look best when the lines are matched across cushions and seams, so allow a little extra fabric. Small checks suit dining chairs; bold buffalo checks suit benches and accent chairs.', ['plaid', 'herringbone', 'striped', 'black']],
    ['botanical', 'Tropical & Botanical', ['tropical-botanical', 'leaves'], 'Botanical & Leaf Print Fabric', 'Palms, ferns, vines and leaves: botanical fabrics bring the outdoors in, for sunrooms, cottages and fresh, relaxed interiors.', 'Botanicals pair naturally with rattan, wood and linen. Use a large leaf print on a statement piece, and smaller leaf patterns on pillows and dining chairs.', ['floral', 'outdoor', 'green', 'printed']],
    ['solid', 'Solids', ['plain-solid'], 'Solid Colour Upholstery Fabric', 'The foundation of every room: solid-colour upholstery fabrics in every shade and texture, from velvet to linen to performance weaves.', 'Solids are the easiest to use and the easiest to change around with pillows and throws. Choose texture to add interest, and a performance finish if the piece gets daily use.', ['velvet', 'linen', 'performance', 'microsuede']],
    ['diamond', 'Diamonds & Trellis', ['diamonds'], 'Diamond & Trellis Pattern Fabric', 'Diamond, lattice and trellis patterns offer an easy, structured repeat that suits both classic and modern furniture.', 'Small-scale diamonds work almost like a textured solid; open trellis designs feel lighter and suit headboards and drapery.', ['geometric', 'greek-key', 'woven', 'blue']],
    ['global', 'Global & Ikat', ['global'], 'Global & Ikat Fabric', 'Ikat, suzani, kilim-inspired and other global designs add colour, story and craft to chairs, ottomans and pillows.', 'Global patterns layer well with each other when they share a colour. Use one as the hero and keep the rest of the room’s fabrics simpler.', ['paisley', 'southwestern', 'geometric', 'orange']],
    ['southwestern', 'Southwestern', ['southwestern'], 'Southwestern Pattern Fabric', 'Warm, earthy southwestern and Aztec-inspired designs for lodge, cabin and cottage furniture.', 'These patterns look great on benches, ottomans and cushions in rustic spaces. Pair them with leather, wood and solid textures in terracotta, rust and cream.', ['global', 'plaid', 'orange', 'brown']],
    ['greek-key', 'Greek Key', ['greek-key'], 'Greek Key Pattern Fabric', 'The classic Greek key border adds architectural, tailored detail to chairs, cushions and drapery.', 'Greek key designs look sharp on cushion fronts, ottoman sides and as drapery trim. Tone-on-tone versions add subtle polish.', ['geometric', 'diamond', 'damask', 'blue']],
    ['corduroy', 'Corduroy', ['corduroy'], 'Corduroy Upholstery Fabric', 'Soft, ribbed corduroy is back: a cozy, retro-inspired choice for sofas, lounge chairs and floor cushions.', 'Keep the wales running the same direction on every panel. Wide-wale corduroy makes a strong vintage statement; fine wales look more refined.', ['velvet', 'chenille', 'brown', 'orange']],
  ] as [string, string, string[], string, string, string, string[]][]).map(
    ([slug, label, values, title, intro, tip, related]): FabricCollection => ({
      slug,
      group: 'pattern',
      label,
      title,
      metaTitle: `${title} by the Yard`,
      description: `Shop ${title.toLowerCase()} by the yard for sofas, chairs, cushions and drapery. Shipped across Canada, with free samples and prices in CAD.`,
      intro,
      sections: [{ heading: `Tips for using ${label.toLowerCase()}`, body: tip }],
      rule: { pattern: values },
      shopQuery: `pattern=${values.join(',')}`,
      related,
    })
  ),

  // ───────────────────────────── Colours ─────────────────────────────
  ...([
    ['blue', 'Blue', 'blue', 'From soft sky to deep navy, blue upholstery fabric is calming, classic and one of the easiest colours to live with.', 'Navy is a sophisticated alternative to grey or black on a sofa; lighter blues feel fresh in coastal and cottage rooms.'],
    ['grey', 'Grey & Silver', 'grey-silver', 'Grey upholstery fabric is the modern neutral: it pairs with almost any accent colour and hides everyday wear well.', 'Warm greys (greige) suit wood and beige tones; cool greys suit white, black and blue. Charcoal hides wear best on busy family sofas.'],
    ['beige', 'Beige & Neutral', 'beige-taupe', 'Beige, taupe, oatmeal and sand: neutral upholstery fabrics create a calm, timeless base for any room.', 'Neutrals rely on texture to stay interesting, so consider a tweed, linen-look or bouclé. Choose a performance neutral if the piece is used daily.'],
    ['green', 'Green', 'green', 'Sage, olive, emerald and forest: green upholstery fabric brings nature indoors and has become one of today’s favourite sofa colours.', 'Deep greens look rich in velvet; soft sage suits linen and textured weaves. Green pairs beautifully with wood, brass and warm whites.'],
    ['brown', 'Brown', 'brown', 'Chocolate, cognac, camel and mocha: brown upholstery fabrics are warm, grounded and forgiving of everyday wear.', 'Browns suit leather-look microsuedes and textured weaves. They pair naturally with cream, rust and green accents.'],
    ['teal', 'Aqua & Teal', 'aqua-teal', 'Aqua and teal upholstery fabrics add a jewel-toned or coastal pop to accent chairs, headboards and pillows.', 'Deep teal velvet makes a dramatic statement chair; lighter aquas feel breezy in sunrooms and cottages.'],
    ['red', 'Red & Burgundy', 'red-burgundy', 'Red and burgundy upholstery fabrics bring warmth and drama, from classic library reds to rich wine velvets.', 'Burgundy and oxblood feel sophisticated on a single chair or a Chesterfield. Use brighter reds in small doses on pillows or an ottoman.'],
    ['yellow', 'Gold & Yellow', 'gold-yellow', 'Mustard, ochre, gold and buttercup: yellow upholstery fabrics add sunshine and optimism to a room.', 'Mustard and ochre are the most versatile yellows for furniture; they pair beautifully with navy, grey and green.'],
    ['black', 'Black', 'black', 'Black upholstery fabric is bold, graphic and surprisingly practical: it hides stains and grounds a light room.', 'Black shows light-coloured pet hair and dust, so textured blacks and charcoal-blacks are easier to live with than flat solids.'],
    ['orange', 'Orange & Rust', 'orange-rust', 'Rust, terracotta, burnt orange and pumpkin: warm, earthy orange upholstery fabrics are a designer favourite.', 'Terracotta and rust pair well with cream, olive and navy, and look especially good in velvet and textured weaves.'],
    ['white', 'White & Ivory', 'white-ivory', 'White and ivory upholstery fabrics make a room feel bright, open and serene, and performance whites make them practical too.', 'For a white sofa in a busy home, choose a performance or bleach-cleanable fabric. Ivory and cream are more forgiving than stark white.'],
    ['pink', 'Pink', 'pink', 'Blush, rose and dusty pink upholstery fabrics add softness and warmth, from subtle neutrals to statement velvets.', 'Dusty and muted pinks work almost as neutrals alongside grey, green and cream. Brighter pinks shine on accent chairs and pillows.'],
    ['coral', 'Coral & Peach', 'coral-peach', 'Coral, peach and apricot upholstery fabrics bring a cheerful, sun-warmed tone to accent pieces and coastal rooms.', 'Coral pairs well with navy, aqua and crisp white; peach suits softer, earthy palettes.'],
    ['purple', 'Purple', 'purple', 'Plum, aubergine, lavender and violet: purple upholstery fabrics add richness and a little drama.', 'Deep plum velvet makes a luxurious statement chair; lavender and lilac feel soft and airy on bedroom pieces.'],
  ] as [string, string, string, string, string][]).map(
    ([slug, label, value, intro, tip]): FabricCollection => ({
      slug,
      group: 'colour',
      label,
      title: `${label} Upholstery Fabric`,
      metaTitle: `${label} Upholstery Fabric by the Yard`,
      description: `Shop ${label.toLowerCase()} upholstery fabric by the yard in Canada: velvets, textures, performance fabrics and patterns. Free samples, prices in CAD.`,
      intro,
      sections: [{ heading: `Decorating with ${label.toLowerCase()}`, body: tip }],
      rule: { color: [value] },
      shopQuery: `color=${value}`,
    })
  ),
];

const bySlug = new Map(COLLECTIONS.map((collection) => [collection.slug, collection]));

export const getCollection = (slug: string): FabricCollection | undefined => bySlug.get(slug);

// Every collection, grouped for menus and link directories.
export const collectionGroups = () =>
  (Object.keys(COLLECTION_GROUP_LABELS) as CollectionGroup[]).map((group) => ({
    group,
    label: COLLECTION_GROUP_LABELS[group],
    links: COLLECTIONS.filter((c) => c.group === group).map((c) => ({ slug: c.slug, label: c.label })),
  }));

// A collection page's address; page 2 onward lives at /fabrics/<slug>/page/<n>.
export const collectionHref = (slug: string, page = 1) => (page > 1 ? `/fabrics/${slug}/page/${page}` : `/fabrics/${slug}`);

// ---- Matching a single fabric to its collections (fabric pages link "up" to these) ----

export interface FabricTags {
  material?: string[];
  pattern?: string[];
  color?: string[];
  properties?: string[];
  markets?: string[];
  applications?: string[];
  cleanability?: string;
  durability?: string;
}

const overlaps = (want: string[] | undefined, have: string[] | undefined) => !want || want.some((value) => (have || []).includes(value));

export function fabricMatchesRule(rule: CollectionRule, fabric: FabricTags): boolean {
  if (!overlaps(rule.material, fabric.material)) return false;
  if (!overlaps(rule.pattern, fabric.pattern)) return false;
  if (!overlaps(rule.color, fabric.color)) return false;
  if (!overlaps(rule.properties, fabric.properties)) return false;
  if (!overlaps(rule.markets, fabric.markets)) return false;
  if (!overlaps(rule.applications, fabric.applications)) return false;
  if (rule.cleanabilityContains && !(fabric.cleanability || '').toLowerCase().includes(rule.cleanabilityContains)) return false;
  if (rule.minDoubleRubs) {
    const rubs = Number((fabric.durability || '').replace(/,/g, '').match(/(\d{4,7})/)?.[1] || 0);
    if (rubs < rule.minDoubleRubs) return false;
  }
  return true;
}

// Every collection a fabric belongs to, fabric type first, then use, pattern and colour.
export const collectionsForFabric = (fabric: FabricTags): FabricCollection[] =>
  COLLECTIONS.filter((collection) => fabricMatchesRule(collection.rule, fabric));

// Short words for a fabric's page title: "D2215 Sky – Grey Textured Upholstery Fabric".
const MATERIAL_WORDS: Record<string, string> = {
  velvet: 'Velvet', chenille: 'Chenille', boucle: 'Bouclé', linen: 'Linen', 'tweed-textures': 'Textured', crypton: 'Crypton',
  'microfiber-microsuede': 'Microsuede', 'canvas-denim-twill': 'Canvas', tapestry: 'Tapestry', matelasse: 'Matelassé',
  shearling: 'Shearling', metallic: 'Metallic', embroidery: 'Embroidered', prints: 'Printed', 'woven-patterns': 'Woven',
  'faux-wool': 'Faux Wool', 'faux-silk': 'Faux Silk',
};
const COLOUR_WORDS: Record<string, string> = {
  'red-burgundy': 'Red', 'orange-rust': 'Rust', 'gold-yellow': 'Gold', green: 'Green', 'aqua-teal': 'Teal', blue: 'Blue',
  purple: 'Purple', 'coral-peach': 'Coral', pink: 'Pink', 'beige-taupe': 'Beige', brown: 'Brown', black: 'Black',
  'grey-silver': 'Grey', 'white-ivory': 'Ivory',
};

export function fabricKeywords(fabric: FabricTags): string {
  const colour = fabric.color?.map((c) => COLOUR_WORDS[c]).find(Boolean);
  const material = fabric.material?.map((m) => MATERIAL_WORDS[m]).find(Boolean);
  return [colour, material].filter(Boolean).join(' ');
}
