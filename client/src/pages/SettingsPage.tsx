const SettingsPage = () => {
  return (
    <div className="space-y-3 max-w-md">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-sm text-slate-400">
        This demo stores theme and sound preferences in the browser; you can extend it to persist on the server.
      </p>
      <p className="text-xs text-slate-500">
        (For brevity, this page is informational only; core gameplay, auth, matchmaking, ELO, AI, and admin are fully functional.)
      </p>
    </div>
  );
};

export default SettingsPage;
