"use client";

import { useQuery } from "@tanstack/react-query";
import { loadWasmEngine } from "../../../utilities/wasm-fetch/wasm-fetch";

export default function VisionModel() {
  const { data: engine, isLoading: loadingWasm } = useQuery({
    queryKey: ["VM-WASM"],
    queryFn: loadWasmEngine,
    refetchInterval: Infinity,
  });

  return (
    <div className="w-full text-center">
      {loadingWasm && <p>not loaded</p>}

      {engine && <p>{engine.add(BigInt(1), BigInt(1))}</p>}
    </div>
  );
}
