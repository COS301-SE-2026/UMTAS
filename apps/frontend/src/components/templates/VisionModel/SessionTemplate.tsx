export default function VM_SessionTemplate() {
  return (
    <div className="h-[80vh] items-center flex flex-col gap-6 w-full px-6">
      <div className="w-full h-full max-w-6xl overflow-auto border border-[var(--border)] rounded-xl bg-[var(--bg-surface)] shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--text-primary)] pl-4 pt-4">
          Session Camera
        </h1>
        <div className="w-full p-4"></div>
      </div>
    </div>
  );
}
