import { create } from 'zustand';

interface WishlistStore {
  wishlistVariantIds: string[];
  isLoaded: boolean;
  isLoading: boolean;
  fetchWishlist: (token: string) => Promise<void>;
  isInWishlist: (variantId?: string) => boolean;
  toggleWishlist: (variantId: string, token: string) => Promise<{ added: boolean }>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  wishlistVariantIds: [],
  isLoaded: false,
  isLoading: false,

  fetchWishlist: async (token: string) => {
    if (!token || get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await fetch('/api/v1/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        const ids = items.map((item: any) => item.variant_id);
        set({ wishlistVariantIds: ids, isLoaded: true });
      }
    } catch {
      // Ignored
    } finally {
      set({ isLoading: false });
    }
  },

  isInWishlist: (variantId?: string) => {
    if (!variantId) return false;
    return get().wishlistVariantIds.includes(variantId);
  },

  toggleWishlist: async (variantId: string, token: string) => {
    const isCurrentlyWishlisted = get().isInWishlist(variantId);

    // Optimistic update
    if (isCurrentlyWishlisted) {
      set({
        wishlistVariantIds: get().wishlistVariantIds.filter((id) => id !== variantId),
      });
    } else {
      set({
        wishlistVariantIds: [...get().wishlistVariantIds, variantId],
      });
    }

    try {
      if (isCurrentlyWishlisted) {
        await fetch(`/api/v1/wishlist/${variantId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        return { added: false };
      } else {
        await fetch('/api/v1/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ variantId }),
        });
        return { added: true };
      }
    } catch (err) {
      // Rollback on failure
      if (isCurrentlyWishlisted) {
        set({ wishlistVariantIds: [...get().wishlistVariantIds, variantId] });
      } else {
        set({ wishlistVariantIds: get().wishlistVariantIds.filter((id) => id !== variantId) });
      }
      throw err;
    }
  },

  clearWishlist: () => set({ wishlistVariantIds: [], isLoaded: false }),
}));
