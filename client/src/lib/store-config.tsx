import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface StoreConfig {
  deliveryCost: number;
  freeDeliveryThreshold: number;
  storeName: string;
  storePhone: string;
  whatsappNumber: string;
  defaultCarrier: string;
  storeLogo: string | null;
  storeIcon: string | null;
}

interface StoreConfigContextType {
  config: StoreConfig | null;
  isLoading: boolean;
}

const defaultConfig: StoreConfig = {
  deliveryCost: 35,
  freeDeliveryThreshold: 300,
  storeName: "متجرنا",
  storePhone: "+212 6 00 00 00 00",
  whatsappNumber: "212600000000",
  defaultCarrier: "digylog",
  storeLogo: null,
  storeIcon: null,
};

const StoreConfigContext = createContext<StoreConfigContextType>({
  config: defaultConfig,
  isLoading: false,
});

export function StoreConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery<StoreConfig>({
    queryKey: ["/api/store-config"],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <StoreConfigContext.Provider value={{ config: data || defaultConfig, isLoading }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  return context;
}
