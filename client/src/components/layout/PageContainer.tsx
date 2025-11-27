const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="flex-1 overflow-y-auto bg-slate-950">
    <div className="max-w-5xl mx-auto p-4">{children}</div>
  </main>
);
export default PageContainer;
