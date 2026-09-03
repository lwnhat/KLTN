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

export interface AddItemResult {
  success: boolean;
  addedQty: number;
  message?: string;
}

interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'id'>) => AddItemResult;
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
        const maxStock = newItemData.stock !== undefined ? Math.max(0, newItemData.stock) : 9999;

        // 1. Kiểm tra nếu sản phẩm hết hàng
        if (maxStock <= 0) {
          return {
            success: false,
            addedQty: 0,
            message: 'Sản phẩm này hiện đã hết hàng, không thể đặt mua thêm.',
          };
        }

        // 2. Tính tổng số lượng của biến thể này đã có trong giỏ hàng
        const existingVariantItems = currentItems.filter((i) => i.variantId === newItemData.variantId);
        const currentTotalInCart = existingVariantItems.reduce((sum, i) => sum + i.quantity, 0);

        // 3. Nếu đã đạt giới hạn tồn kho
        if (currentTotalInCart >= maxStock) {
          return {
            success: false,
            addedQty: 0,
            message: `Bạn đã thêm toàn bộ ${maxStock} sản phẩm có sẵn vào giỏ hàng. Không thể mua vượt quá tồn kho.`,
          };
        }

        // 4. Giới hạn số lượng thêm vào không vượt quá phần tồn kho còn lại
        const remainingCanAdd = maxStock - currentTotalInCart;
        const actualAddQty = Math.min(Math.max(1, newItemData.quantity), remainingCanAdd);

        // 5. Nếu không tùy biến khắc chữ -> gộp số lượng vào mục sẵn có
        if (!isCustomized) {
          const existingIndex = currentItems.findIndex(
            (i) => i.variantId === newItemData.variantId && !i.isCustomized
          );
          if (existingIndex !== -1) {
            const updatedItems = [...currentItems];
            updatedItems[existingIndex].quantity += actualAddQty;
            if (newItemData.stock !== undefined) {
              updatedItems[existingIndex].stock = newItemData.stock;
            }
            const subtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
            set({ items: updatedItems, subtotal, itemCount });
            return { success: true, addedQty: actualAddQty };
          }
        }

        // 6. Tạo mục mới nếu có khắc chữ hoặc chưa có trong giỏ
        const newItem: CartItem = {
          ...newItemData,
          price: Number(newItemData.price || 0),
          quantity: actualAddQty,
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };

        const updatedItems = [...currentItems, newItem];
        const subtotal = updatedItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        set({ items: updatedItems, subtotal, itemCount });
        return { success: true, addedQty: actualAddQty };
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const updatedItems = get().items.map((i) => {
          if (i.id === id) {
            const max = i.stock !== undefined ? Math.max(0, i.stock) : 9999;
            const clamped = Math.min(Math.max(1, quantity), max);
            return { ...i, quantity: clamped };
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
