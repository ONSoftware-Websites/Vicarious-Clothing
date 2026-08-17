"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ShopUiState {
  searchOpen: boolean;
  bagOpen: boolean;
  menuOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  openBag: () => void;
  closeBag: () => void;
  toggleMenu: () => void;
  closeMenu: () => void;
  closeAll: () => void;
}

const ShopUiContext = createContext<ShopUiState | null>(null);

export function ShopUiProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeAll = useCallback(() => {
    setSearchOpen(false);
    setBagOpen(false);
    setMenuOpen(false);
  }, []);

  const value: ShopUiState = {
    searchOpen,
    bagOpen,
    menuOpen,
    openSearch: () => {
      setBagOpen(false);
      setMenuOpen(false);
      setSearchOpen(true);
    },
    closeSearch: () => setSearchOpen(false),
    openBag: () => {
      setSearchOpen(false);
      setMenuOpen(false);
      setBagOpen(true);
    },
    closeBag: () => setBagOpen(false),
    toggleMenu: () => setMenuOpen((m) => !m),
    closeMenu: () => setMenuOpen(false),
    closeAll,
  };

  return (
    <ShopUiContext.Provider value={value}>{children}</ShopUiContext.Provider>
  );
}

export function useShopUi() {
  const ctx = useContext(ShopUiContext);
  if (!ctx) throw new Error("useShopUi must be used within ShopUiProvider");
  return ctx;
}
