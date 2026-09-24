import { supabase } from '@/lib/supabase/client';
import { CheckoutError } from '@/lib/checkout/errors';
import { toCents } from '@/lib/checkout/pricing';
import { resolveEffectivePrice } from '@/lib/data/charlotteFabricPricing';
import { getFabricPriceTags } from '@/lib/data/fabricPriceTags';
import { getFoamType } from '@/lib/data/foam';
import { getFoamGrades } from '@/lib/data/foam-grades';
import { getFibreWraps } from '@/lib/data/fibre-wrap';
import { getDimensionRules } from '@/lib/data/dimension-rules';
import { getCategory } from '@/lib/data/categories';
import { getBenchCushionStyle } from '@/lib/data/benchCushions';
import { computeFoamPrice } from '@/lib/pricing/foam';
import { ShippingLine } from '@/lib/types/checkout';
import type { CartItem } from '@/lib/context/CartContext';

/**
 * A cart line priced entirely from the database. The browser's cart only says *what* was chosen
 * (ids, dimensions, option labels, quantity); every price and every name that reaches Stripe comes
 * from here, so editing localStorage can't change what an order costs.
 */
export interface PricedLine extends ShippingLine {
  itemId: string;
  name: string;
  description: string;
  unitPriceCents: number;
  fabricId?: string; // Charlotte fabric sold by the yard (what the supplier PO lists)
  sku?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VINYL_PATTERN = /vinyl/i;
const MAX_QUANTITY = 999;
const MAX_DIMENSION_INCHES = 1000;

interface PricedFabric {
  id: string;
  name: string;
  sku: string;
  pricePerYard: number;
  isVinyl: boolean;
}

const invalid = (message = 'Your cart contains an item we could not verify. Please remove it and add it again.') =>
  new CheckoutError(message);

const toQuantity = (value: unknown): number => {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) throw invalid('Please check the quantities in your cart.');
  return quantity;
};

const toDimension = (value: unknown): number => {
  const inches = Number(value);
  if (!Number.isFinite(inches) || inches <= 0 || inches > MAX_DIMENSION_INCHES) throw invalid();
  return inches;
};

const formatInches = (inches: number) => `${Number(inches.toFixed(3))}"`;

// One query for every Charlotte fabric in the cart (standalone yardage and cushion fabrics), priced
// with the same resolveEffectivePrice() the fabric page uses to show the price.
const loadFabrics = async (ids: string[]): Promise<Map<string, PricedFabric>> => {
  if (ids.length === 0) return new Map();
  if (ids.some((id) => !UUID_PATTERN.test(id))) throw invalid();
  if (!supabase) throw new CheckoutError('Checkout is unavailable right now.', 503);

  const [{ data, error }, priceTags] = await Promise.all([
    supabase
      .from('charlotte_fabrics')
      .select('id, name, sku, status, manual_retail_price, retail_price, price_tag_id, material, construction_type, fiber_content')
      .in('id', Array.from(new Set(ids))),
    getFabricPriceTags(),
  ]);
  if (error) {
    console.error('Error loading fabrics for checkout:', error);
    throw new CheckoutError('Checkout is unavailable right now.', 503);
  }

  const priceTagsById = new Map(priceTags.map((tag) => [tag.id, { name: tag.name, pricePerYard: tag.pricePerYard }]));
  const fabrics = new Map<string, PricedFabric>();
  for (const row of data || []) {
    if (row.status !== 'active') continue;
    const { pricePerYard } = resolveEffectivePrice(
      {
        manualRetailPrice: row.manual_retail_price == null ? null : Number(row.manual_retail_price),
        retailPrice: row.retail_price == null ? undefined : Number(row.retail_price),
        priceTagId: row.price_tag_id,
      },
      priceTagsById
    );
    if (pricePerYard == null) continue;
    fabrics.set(row.id, {
      id: row.id,
      name: row.name,
      sku: row.sku,
      pricePerYard: Number(pricePerYard),
      isVinyl: [...(row.material || []), ...(row.construction_type || []), row.fiber_content || ''].some((value: string) =>
        VINYL_PATTERN.test(value)
      ),
    });
  }
  return fabrics;
};

const requireFabric = (fabrics: Map<string, PricedFabric>, id: string | undefined, name?: string): PricedFabric => {
  const fabric = id ? fabrics.get(id) : undefined;
  if (!fabric) throw invalid(`${name || 'A fabric in your cart'} is no longer available. Please remove it from your cart.`);
  return fabric;
};

const priceFabric = (item: CartItem, fabrics: Map<string, PricedFabric>): PricedLine => {
  const fabric = requireFabric(fabrics, item.fabricId, item.fabricName);
  const quantity = toQuantity(item.quantity);
  const unitPriceCents = toCents(fabric.pricePerYard);
  return {
    itemId: item.id,
    kind: fabric.isVinyl ? 'vinyl' : 'fabric',
    fabricId: fabric.id,
    sku: fabric.sku,
    name: fabric.name,
    description: `${fabric.sku ? `SKU ${fabric.sku} — ` : ''}${quantity} yard${quantity === 1 ? '' : 's'}`,
    quantity,
    unitPriceCents,
    amountCents: unitPriceCents * quantity,
  };
};

const priceFoam = async (item: CartItem): Promise<PricedLine> => {
  if (!item.typeId || !item.gradeId || !item.dimensions) throw invalid();
  const [foamType, grades, wraps, rules] = await Promise.all([
    getFoamType(item.typeId),
    getFoamGrades(),
    item.wrapId ? getFibreWraps() : Promise.resolve([]),
    getDimensionRules(),
  ]);
  const grade = grades.find((g) => g.id === item.gradeId);
  const wrap = item.wrapId ? wraps.find((w) => w.id === item.wrapId) : null;
  if (!foamType || !grade || (item.wrapId && !wrap)) throw invalid();
  const category = foamType.categoryId ? await getCategory(foamType.categoryId) : null;

  const rawDepth = toDimension(item.dimensions.rawDepth);
  const rawWidth = toDimension(item.dimensions.rawWidth);
  const price = computeFoamPrice({
    rawThickness: toDimension(item.dimensions.rawThickness ?? item.dimensions.thickness),
    rawDepth,
    rawWidth,
    gradePricePerCubicFoot: grade.price,
    wrapValuePerCubicFoot: wrap ? wrap.value : null,
    rules,
  });

  const quantity = toQuantity(item.quantity);
  const unitPriceCents = toCents(price.unitPrice);
  return {
    itemId: item.id,
    kind: 'foam',
    name: `${category?.name || item.categoryName || 'Foam'} - ${foamType.name}`,
    description: `Dims: ${formatInches(price.thickness)} x ${formatInches(rawDepth)} x ${formatInches(rawWidth)} | Grade: ${grade.brand} - ${grade.gradeName}${
      wrap ? ` | Wrap: ${wrap.fibreThickness}` : ''
    }`,
    quantity,
    unitPriceCents,
    amountCents: unitPriceCents * quantity,
  };
};

const priceBenchCushion = async (item: CartItem, fabrics: Map<string, PricedFabric>): Promise<PricedLine> => {
  if (!item.cushionStyleId) throw invalid();
  const style = await getBenchCushionStyle(item.cushionStyleId);
  if (!style) throw invalid(`${item.cushionStyleName || 'A bench cushion style in your cart'} is no longer available.`);

  // Every option group that has choices must be answered once, with a choice that exists today.
  const chosen = new Map((item.cushionOptions || []).map((option) => [option.groupName, option.choiceLabel]));
  if (chosen.size !== (item.cushionOptions || []).length) throw invalid();
  let optionsTotal = 0;
  const optionLabels: string[] = [];
  for (const variable of style.variables) {
    if (variable.options.length === 0) continue;
    const option = variable.options.find((o) => o.label === chosen.get(variable.name));
    if (!option) throw invalid(`The options for ${style.name} have changed. Please remove it and configure it again.`);
    optionsTotal += option.priceModifier || 0;
    optionLabels.push(`${variable.name}: ${option.label}`);
    chosen.delete(variable.name);
  }
  if (chosen.size > 0) throw invalid();

  const allowedDimensions = new Set(style.dimensions.map((d) => d.name));
  const dims = Object.entries(item.cushionDimensions || {}).map(([dimName, value]) => {
    if (!allowedDimensions.has(dimName)) throw invalid();
    return `${dimName}: ${formatInches(toDimension(value))}`;
  });

  let fabricCost = 0;
  let fabricLabel = '';
  if (item.fabric) {
    const fabric = requireFabric(fabrics, item.fabric.id, item.fabric.name);
    fabricCost = style.estimatedYards * fabric.pricePerYard;
    fabricLabel = `Fabric: ${fabric.name}${fabric.sku ? ` (SKU ${fabric.sku})` : ''} +$${fabricCost.toFixed(2)}`;
  }

  const quantity = toQuantity(item.quantity);
  const unitPriceCents = toCents(style.basePrice + optionsTotal + fabricCost);
  return {
    itemId: item.id,
    kind: 'benchCushion',
    name: style.name,
    description: [dims.join(', '), optionLabels.join(', '), fabricLabel].filter(Boolean).join(' | '),
    quantity,
    unitPriceCents,
    amountCents: unitPriceCents * quantity,
  };
};

export const priceCart = async (items: CartItem[]): Promise<PricedLine[]> => {
  if (!Array.isArray(items) || items.length === 0) throw new CheckoutError('No items in cart');
  if (items.length > 100) throw invalid('Your cart has too many items.');

  const fabricIds = items.flatMap((item) =>
    item.productType === 'fabric' ? [item.fabricId || ''] : item.productType === 'benchCushion' && item.fabric ? [item.fabric.id] : []
  );
  const fabrics = await loadFabrics(fabricIds);

  return Promise.all(
    items.map((item) =>
      item.productType === 'fabric'
        ? priceFabric(item, fabrics)
        : item.productType === 'benchCushion'
        ? priceBenchCushion(item, fabrics)
        : priceFoam(item)
    )
  );
};
