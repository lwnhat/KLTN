import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EngravingMetadata {
  type: 'engraving';
  text: string;
  font: 'Classic' | 'Script' | 'Modern' | 'Bold';
  position: 'inner_band' | 'outer_band' | 'clasp';
  extra_fee: number;
}

export interface CartItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  productSlug: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  customizationMetadata: EngravingMetadata | null;
  isCustomized: boolean;
  allowEngraving?: boolean;
  engravingFee?: number;
  maxEngravingChars?: number;
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      itemCount: 0,

      addItem: (newItemData) => {
        const currentItems = get().items;
        const isCustomized = !!newItemData.customizationMetadata;
        const maxStock = newItemData.stock !== undefined ? newItemData.stock : 99;

        // If NOT customized -> merge quantity if same variantId exists
        if (!isCustomized) {
          const existingIndex = currentItems.findIndex(
            (i) => i.variantId === newItemData.variantId && !i.isCustomized
          );
          if (existingIndex !== -1) {
            const updatedItems = [...currentItems];
            const targetQty = Math.min(updatedItems[existingIndex].quantity + newItemData.quantity, maxStock);
            updatedItems[existingIndex].quantity = targetQty;
            const subtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            set({ items: updatedItems, subtotal, itemCount });
            return;
          }
        }

        // Customized OR new item -> create unique entry
        const newItem: CartItem = {
          ...newItemData,
          price: Number(newItemData.price || 0),
          quantity: Math.min(newItemData.quantity, maxStock),
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };

        const updatedItems = [...currentItems, newItem];
        const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        set({ items: updatedItems, subtotal, itemCount });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const updatedItems = get().items.map((i) => {
          if (i.id === id) {
            const max = i.stock !== undefined ? i.stock : 99;
            return { ...i, quantity: Math.min(quantity, max) };
          }
          return i;
        });
        const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        set({ items: updatedItems, subtotal, itemCount });
      },

      removeItem: (id) => {
        const updatedItems = get().items.filter((i) => i.id !== id);
        const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        set({ items: updatedItems, subtotal, itemCount });
      },


      clearCart: () => set({ items: [], subtotal: 0, itemCount: 0 }),
    }),
    { name: 'kltn-cart-storage' }
  )
);
