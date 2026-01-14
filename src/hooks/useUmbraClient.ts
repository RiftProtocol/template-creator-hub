import { useMemo } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getUmbraClient, UmbraClient } from "@/lib/umbra";

export function useUmbraClient(): UmbraClient {
  const { connection } = useConnection();
  
  const client = useMemo(() => {
    return getUmbraClient(connection);
  }, [connection]);

  return client;
}
