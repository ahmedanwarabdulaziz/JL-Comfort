export interface FabricFacetOption {
  value: string;
  label: string;
}

// Charlotte Fabrics' real FacetWP filter taxonomy for the /product-category/fabric/
// listing, captured from the live site. Query params use `_<key>=<value>`, e.g.
// ?_color=blue&_pattern=stripe&_material=velvet (confirmed against the live site).
export const CHARLOTTE_FABRIC_COLORS: FabricFacetOption[] = [
  { value: 'red-burgundy', label: 'Red & Burgundy' },
  { value: 'orange-rust', label: 'Orange & Rust' },
  { value: 'gold-yellow', label: 'Gold & Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'aqua-teal', label: 'Aqua & Teal' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'coral-peach', label: 'Coral & Peach' },
  { value: 'pink', label: 'Pink' },
  { value: 'beige-taupe', label: 'Neutral' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'grey-silver', label: 'Grey & Silver' },
  { value: 'white-ivory', label: 'White & Ivory' },
];

export const CHARLOTTE_FABRIC_PATTERNS: FabricFacetOption[] = [
  { value: 'abstract-geometric', label: 'Abstract & Geometric' },
  { value: 'animal-print', label: 'Animal Print' },
  { value: 'check-houndstooth', label: 'Check & Houndstooth' },
  { value: 'corduroy', label: 'Corduroy' },
  { value: 'damask', label: 'Damask' },
  { value: 'diamonds', label: 'Diamonds' },
  { value: 'floral', label: 'Floral' },
  { value: 'global', label: 'Global' },
  { value: 'greek-key', label: 'Greek Key' },
  { value: 'herringbone-chevron', label: 'Herringbone & Chevron' },
  { value: 'leaves', label: 'Leaves' },
  { value: 'novelty', label: 'Novelty' },
  { value: 'paisley', label: 'Paisley' },
  { value: 'plaid', label: 'Plaid' },
  { value: 'plain-solid', label: 'Plain & Solid' },
  { value: 'small-scale', label: 'Small Scale' },
  { value: 'southwestern', label: 'Southwestern' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'toile', label: 'Toile' },
  { value: 'tropical-botanical', label: 'Tropical & Botanical' },
  { value: 'twill', label: 'Twill' },
];

export const CHARLOTTE_FABRIC_MATERIALS: FabricFacetOption[] = [
  { value: 'boucle', label: 'Boucle' },
  { value: 'canvas-denim-twill', label: 'Canvas, Denim & Twill' },
  { value: 'chenille', label: 'Chenille' },
  { value: 'crypton', label: 'Crypton' },
  { value: 'embroidery', label: 'Embroidery' },
  { value: 'faux-silk', label: 'Faux Silk' },
  { value: 'faux-wool', label: 'Faux Wool' },
  { value: 'linen', label: 'Linen' },
  { value: 'matelasse', label: 'Matelasse' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'microfiber-microsuede', label: 'Microfiber & Microsuede' },
  { value: 'prints', label: 'Prints' },
  { value: 'shearling', label: 'Shearling' },
  { value: 'tapestry', label: 'Tapestry' },
  { value: 'tweed-textures', label: 'Tweed & Textures' },
  { value: 'velvet', label: 'Velvet' },
  { value: 'woven-patterns', label: 'Woven Patterns' },
];
