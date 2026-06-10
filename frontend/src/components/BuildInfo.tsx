const productVersion = import.meta.env.VITE_APP_VERSION;

export function BuildInfo() {
  return (
    <p
      data-testid="build-info"
      className="text-center text-xs text-text-muted"
    >
      v{productVersion}
    </p>
  );
}
