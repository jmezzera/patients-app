export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="text-muted-foreground">
        Please check your internet connection and try again.
      </p>
    </div>
  );
}
