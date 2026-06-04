const productVersion = import.meta.env.VITE_APP_VERSION;

export function BuildInfo() {
  return (
    <p
      data-testid="build-info"
      className="text-center text-xs text-gray-500"
    >
      v{productVersion}
    </p>
  );
}
