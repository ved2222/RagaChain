import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MusicRegistryModule = buildModule("MusicRegistryV2Module", (m) => {
  const musicRegistry = m.contract("MusicRegistry");

  return {
    musicRegistry,
  };
});

export default MusicRegistryModule;
