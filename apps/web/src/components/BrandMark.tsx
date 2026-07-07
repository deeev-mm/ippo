/** next/og ImageResponse用のブランドマーク（ippoの足あとロゴ）。favicon/PWAアイコン生成で共用 */
export function BrandMark({ size = 192 }: { size?: number }) {
  const bg = "#ff6b4a";
  const fg = "#fff8ef";
  const u = size / 192; // 192pxを基準にした比率

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * u }}>
        <div style={{ display: "flex", gap: 10 * u }}>
          <div style={{ width: 22 * u, height: 22 * u, borderRadius: "50%", background: fg }} />
          <div
            style={{
              width: 26 * u,
              height: 26 * u,
              borderRadius: "50%",
              background: fg,
              marginTop: -6 * u,
            }}
          />
          <div style={{ width: 22 * u, height: 22 * u, borderRadius: "50%", background: fg }} />
        </div>
        <div
          style={{
            width: 84 * u,
            height: 58 * u,
            borderRadius: `${42 * u}px ${42 * u}px ${46 * u}px ${46 * u}px`,
            background: fg,
          }}
        />
      </div>
    </div>
  );
}
