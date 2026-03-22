export type ItemStatus = "resell" | "pre-love" | "discard";

export interface ReturnItem {
  sku: string;
  name: string;
  category: string;
  originalPrice: number;
  imageEmoji: string;
  aiStatus: ItemStatus;
  aiConfidence: number;
  location: {
    aisle: string;
    shelf: string;
    bin: string;
  };
}

const MOCK_ITEMS: Record<string, ReturnItem> = {
  "SKU-10234": {
    sku: "SKU-10234",
    name: "Nike Air Max 90",
    category: "Footwear",
    originalPrice: 129.99,
    imageEmoji: "👟",
    aiStatus: "resell",
    aiConfidence: 94,
    location: { aisle: "A", shelf: "3", bin: "12" },
  },
  "SKU-20481": {
    sku: "SKU-20481",
    name: "Levi's 501 Original Jeans",
    category: "Apparel",
    originalPrice: 69.50,
    imageEmoji: "👖",
    aiStatus: "pre-love",
    aiConfidence: 87,
    location: { aisle: "B", shelf: "1", bin: "05" },
  },
  "SKU-30912": {
    sku: "SKU-30912",
    name: "Sony WH-1000XM5 Headphones",
    category: "Electronics",
    originalPrice: 349.99,
    imageEmoji: "🎧",
    aiStatus: "resell",
    aiConfidence: 91,
    location: { aisle: "C", shelf: "2", bin: "08" },
  },
  "SKU-41087": {
    sku: "SKU-41087",
    name: "Patagonia Nano Puff Jacket",
    category: "Outerwear",
    originalPrice: 199.00,
    imageEmoji: "🧥",
    aiStatus: "pre-love",
    aiConfidence: 78,
    location: { aisle: "B", shelf: "4", bin: "02" },
  },
  "SKU-50293": {
    sku: "SKU-50293",
    name: "Hydro Flask 32oz Bottle",
    category: "Accessories",
    originalPrice: 44.95,
    imageEmoji: "🫗",
    aiStatus: "discard",
    aiConfidence: 96,
    location: { aisle: "D", shelf: "1", bin: "15" },
  },
  "SKU-60154": {
    sku: "SKU-60154",
    name: "Apple AirPods Pro 2",
    category: "Electronics",
    originalPrice: 249.00,
    imageEmoji: "🎵",
    aiStatus: "resell",
    aiConfidence: 88,
    location: { aisle: "C", shelf: "1", bin: "03" },
  },
  "SKU-70832": {
    sku: "SKU-70832",
    name: "Adidas Ultraboost 22",
    category: "Footwear",
    originalPrice: 189.99,
    imageEmoji: "👟",
    aiStatus: "discard",
    aiConfidence: 82,
    location: { aisle: "D", shelf: "2", bin: "09" },
  },
  "SKU-80219": {
    sku: "SKU-80219",
    name: "Ray-Ban Wayfarer Sunglasses",
    category: "Accessories",
    originalPrice: 163.00,
    imageEmoji: "🕶️",
    aiStatus: "pre-love",
    aiConfidence: 73,
    location: { aisle: "A", shelf: "1", bin: "07" },
  },
  "SKU-90547": {
    sku: "SKU-90547",
    name: "The North Face Backpack",
    category: "Bags",
    originalPrice: 89.00,
    imageEmoji: "🎒",
    aiStatus: "resell",
    aiConfidence: 95,
    location: { aisle: "A", shelf: "2", bin: "11" },
  },
  "SKU-11382": {
    sku: "SKU-11382",
    name: "Dyson V15 Detect Vacuum",
    category: "Home",
    originalPrice: 749.99,
    imageEmoji: "🏠",
    aiStatus: "discard",
    aiConfidence: 91,
    location: { aisle: "D", shelf: "3", bin: "01" },
  },
};

export function lookupItem(sku: string): ReturnItem | null {
  const normalizedSku = sku.trim().toUpperCase();
  return MOCK_ITEMS[normalizedSku] || null;
}

export function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case "resell":
      return "Resell";
    case "pre-love":
      return "Pre-Love";
    case "discard":
      return "Discard";
  }
}

export function getStatusColor(status: ItemStatus): string {
  switch (status) {
    case "resell":
      return "text-emerald-600";
    case "pre-love":
      return "text-amber-600";
    case "discard":
      return "text-red-600";
  }
}

export function getStatusBg(status: ItemStatus): string {
  switch (status) {
    case "resell":
      return "bg-emerald-50 border-emerald-200";
    case "pre-love":
      return "bg-amber-50 border-amber-200";
    case "discard":
      return "bg-red-50 border-red-200";
  }
}

export function getLocationString(location: ReturnItem["location"]): string {
  return `Aisle ${location.aisle} → Shelf ${location.shelf} → Bin ${location.bin}`;
}

export const ALL_SKUS = Object.keys(MOCK_ITEMS);

