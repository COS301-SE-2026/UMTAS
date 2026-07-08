import ColourPalette from "@/components/molecules/brand-style/ColourPalette";

export function ColourSystem() {
  return (
    <>
      <ColourPalette
        darkColours={["1", "2", "3"]}
        lightColours={["1", "2", "3"]}
      />
      <div>Light mode palette</div>
      <div>Dark mode palette</div>
      <div>Status Colours</div>
      <div>Colour Rules</div>
    </>
  );
}
